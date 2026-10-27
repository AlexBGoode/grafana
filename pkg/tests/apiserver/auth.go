package apiserver

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/configprovider"
	"github.com/grafana/grafana/pkg/infra/kvstore"
	"github.com/grafana/grafana/pkg/infra/localcache"
	"github.com/grafana/grafana/pkg/infra/remotecache"
	"github.com/grafana/grafana/pkg/infra/serverlock"
	usagestats "github.com/grafana/grafana/pkg/infra/usagestats/service"
	"github.com/grafana/grafana/pkg/registry/apis/iam"
	"github.com/grafana/grafana/pkg/services/accesscontrol/acimpl"
	"github.com/grafana/grafana/pkg/services/accesscontrol/permreg"
	"github.com/grafana/grafana/pkg/services/accesscontrol/resourcepermissions"
	"github.com/grafana/grafana/pkg/services/apikey/apikeyimpl"
	grafanaapiserver "github.com/grafana/grafana/pkg/services/apiserver"
	"github.com/grafana/grafana/pkg/services/auth/authimpl"
	"github.com/grafana/grafana/pkg/services/auth/idimpl"
	"github.com/grafana/grafana/pkg/services/authn/authnimpl"
	authnsync "github.com/grafana/grafana/pkg/services/authn/authnimpl/sync"
	"github.com/grafana/grafana/pkg/services/authn/clients"
	"github.com/grafana/grafana/pkg/services/authz"
	"github.com/grafana/grafana/pkg/services/authz/rbac/legacypermissions"
	"github.com/grafana/grafana/pkg/services/contexthandler"
	encryptionprovider "github.com/grafana/grafana/pkg/services/encryption/provider"
	encryptionservice "github.com/grafana/grafana/pkg/services/encryption/service"
	"github.com/grafana/grafana/pkg/services/hooks"
	"github.com/grafana/grafana/pkg/services/kmsproviders/osskmsproviders"
	"github.com/grafana/grafana/pkg/services/licensing"
	"github.com/grafana/grafana/pkg/services/login/authinfoimpl"
	"github.com/grafana/grafana/pkg/services/loginattempt/loginattemptimpl"
	"github.com/grafana/grafana/pkg/services/org/orgimpl"
	"github.com/grafana/grafana/pkg/services/quota/quotaimpl"
	"github.com/grafana/grafana/pkg/services/secrets/database"
	"github.com/grafana/grafana/pkg/services/secrets/manager"
	"github.com/grafana/grafana/pkg/services/signingkeys/signingkeysimpl"
	"github.com/grafana/grafana/pkg/services/supportbundles/bundleregistry"
	"github.com/grafana/grafana/pkg/services/team/teamimpl"
	"github.com/grafana/grafana/pkg/services/user/userimpl"
	"github.com/grafana/grafana/pkg/storage/legacysql"
	"github.com/grafana/grafana/pkg/storage/unified/resource"
	"github.com/grafana/grafana/pkg/web"
)

func configureAuthentication(t *testing.T, env *Environment, routes routing.RouteRegister,
	restConfig grafanaapiserver.RestConfigProvider, eventualResource *resource.EventualClient,
) web.Middleware {
	t.Helper()
	sql := legacysql.NewDatabaseProvider(env.DB)
	configuration, err := configprovider.ProvideService(env.Cfg)
	require.NoError(t, err)
	env.ConfigProvider = configuration
	quota := quotaimpl.ProvideService(t.Context(), sql, configuration)
	env.Quota = quota
	cache := localcache.ProvideService()
	bundles := bundleregistry.ProvideService()
	env.Organizations, err = orgimpl.ProvideService(sql, env.Cfg, quota)
	require.NoError(t, err)
	iamFeatures, err := iam.ProvideFeatures(env.Cfg)
	require.NoError(t, err)
	env.Teams, err = teamimpl.ProvideService(sql, env.Cfg, env.Tracer, env.DirectRestConfigProvider, iamFeatures)
	require.NoError(t, err)
	env.Users, err = userimpl.ProvideService(sql, env.Organizations, env.Cfg, env.Teams,
		cache, env.Tracer, quota, bundles, env.DirectRestConfigProvider)
	require.NoError(t, err)

	evaluation := acimpl.ProvideAccessControl(env.Features)
	env.AccessControl = evaluation
	actions := resourcepermissions.NewActionSetService()
	env.PermissionRegistry = permreg.ProvidePermissionRegistry()
	lock := serverlock.ProvideService(sql, env.Tracer)
	license := licensing.ProvideService(env.Cfg, hooks.ProvideService())
	env.License = license
	roles := legacypermissions.NewRoleCatalog()
	loader := legacypermissions.ProvideLoader(env.DB, roles, actions, cache,
		env.Cfg, env.Features, license, nil, restConfig)
	env.Permissions, err = acimpl.ProvideService(env.Cfg, env.DB, routes, cache, evaluation,
		env.Users, actions, env.Features, env.Tracer, env.PermissionRegistry, lock, nil,
		restConfig, iamFeatures, legacypermissions.ProvideClient(loader, env.Cfg), roles)
	require.NoError(t, err)
	authorization, err := authz.ProvideAuthZClients(env.Cfg, env.Features, nil, env.Tracer,
		env.Registry, env.DB, env.Permissions, actions, nil, restConfig, eventualResource,
		loader, acimpl.ProvideScopeResolverRegistry(evaluation))
	require.NoError(t, err)
	env.AccessClient = authz.ProvideAuthZAccessClient(authorization)

	usage, err := usagestats.ProvideService(env.Cfg, kvstore.ProvideService(env.DB), routes,
		env.Tracer, evaluation, bundles)
	require.NoError(t, err)
	env.UsageStats = usage
	encryption, err := encryptionservice.ProvideEncryptionService(env.Tracer,
		encryptionprovider.ProvideEncryptionProvider(), usage, env.Cfg)
	require.NoError(t, err)
	env.Secrets, err = manager.ProvideSecretsService(env.Tracer, database.ProvideSecretsStore(env.DB),
		osskmsproviders.ProvideService(encryption, env.Cfg, env.Features), encryption,
		env.Cfg, env.Features, usage)
	require.NoError(t, err)
	env.RemoteCache, err = remotecache.ProvideService(env.Cfg, env.DB, usage, env.Secrets)
	require.NoError(t, err)
	ctx := env.Context(t.Context())
	env.AuthInfoStore, err = authinfoimpl.ProvideLegacyStore(ctx, sql, env.Secrets)
	require.NoError(t, err)
	env.AuthInfo = authinfoimpl.ProvideService(authinfoimpl.ProvideStore(env.AuthInfoStore, env.Cfg,
		env.DirectRestConfigProvider, env.Tracer), env.RemoteCache, env.Secrets)
	env.UserTokens, err = authimpl.ProvideUserAuthTokenService(ctx, sql, lock,
		quota, env.Secrets, configuration, env.Tracer, env.Features)
	require.NoError(t, err)
	env.LoginAttempts = loginattemptimpl.ProvideService(env.DB, env.Cfg, lock)
	service := authnimpl.ProvideService(env.Cfg, env.Tracer, env.UserTokens, usage, env.Registry, env.AuthInfo)
	env.Authn = service
	if env.Cfg.BasicAuthEnabled && !env.Cfg.DisableLogin {
		password := clients.ProvidePassword(env.LoginAttempts, env.Tracer, clients.ProvideGrafana(env.Cfg, env.Users, env.Tracer))
		service.RegisterClient(clients.ProvideBasic(password))
	}
	keys, err := apikeyimpl.ProvideService(sql, env.Cfg, quota)
	require.NoError(t, err)
	service.RegisterClient(clients.ProvideAPIKey(keys, env.Tracer))

	userSync := authnsync.ProvideUserSync(env.Users, authinfoimpl.ProvideOSSUserProtectionService(),
		env.AuthInfo, quota, env.Tracer, env.Features, env.Cfg, nil)
	rbacSync := authnsync.ProvideRBACSync(env.Cfg, env.Permissions, env.Tracer, env.PermissionRegistry)
	service.RegisterPostAuthHook(userSync.FetchSyncedUserHook, 100)
	service.RegisterPostAuthHook(rbacSync.SyncCloudRoles, 110)
	service.RegisterPostAuthHook(authnsync.ProvideGroupsClaimSync(env.Cfg).SyncGroupsClaimHook, 115)
	service.RegisterPostAuthHook(rbacSync.SyncPermissionsHook, 120)
	service.RegisterPostAuthHook(userSync.SyncLastSeenHook, 130)
	signingKeys, err := signingkeysimpl.ProvideEmbeddedSigningKeysService(env.DB, env.Secrets, env.RemoteCache, routes)
	require.NoError(t, err)
	signer, err := idimpl.ProvideLocalSigner(signingKeys)
	require.NoError(t, err)
	env.IDService = idimpl.ProvideService(env.Cfg, signer, env.RemoteCache, service, env.Registry, env.Tracer)
	service.RegisterPostAuthHook(authnsync.ProvideNamespaceSync(env.Cfg).SyncNamespace, 150)
	service.RegisterPostAuthHook(authnsync.AccessClaimsHook, 160)
	return contexthandler.ProvideService(env.Cfg, service, env.Features).Middleware
}

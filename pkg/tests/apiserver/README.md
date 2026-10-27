# API integration test environment

`apiserver.New` starts Grafana's production API-server service with isolated SQL
storage. It does not start Grafana's HTTP server or its Wire service graph.
Tests stay in their existing API packages; only setup changes.

## Design

The shared boundary is the production `builder.APIRegistrar`, not an API-specific
router. Register existing `APIGroupBuilder`s and app installers through their
normal constructors. The production service installs their schemas, discovery,
OpenAPI, REST resources, custom routes, admission, authorization, dual writers,
and app lifecycle hooks. The harness has no resource-name dispatch or alternate
implementations of API behavior.

Each environment owns a config, metrics registry, SQL store, unified resource
server, authentication services, RBAC services, and API server. Both legacy and unified SQL storage use the same isolated
database selected by `GRAFANA_TEST_DB`. `db.NewTestStore` creates and cleans up
that database; no shared truncation or environment-variable changes are needed.
Environments can start and execute concurrently with
`t.Parallel()`.

Startup waits for production `/readyz`. The upstream lifecycle handles discovery,
app initialization, and request/watch draining before storage closes. An
in-process listener supplies its lifecycle signals without opening a socket.

`CreateUser` persists users and organization memberships through production
services and loads their `SignedInUser`, as the existing harness does.
`ClientConfig(user)` sends credentials using the production in-process HTTP
transport. Requests pass through Grafana's web context middleware, password
verification, user/role/permission synchronization, signed-in gate, router, and
API-server middleware. The SQL resource server applies the same authorization
wrapper as production. No static identity or permissive access client replaces
this permission path. The transport supports streaming and cancellation.

The production ID service signs authenticated callers using keys persisted in
the environment's SQL store. Its normal post-authentication hook forwards the
caller to unified storage, preserving per-item authorization. The environment
also supplies production auth-info, sessions, encryption, cache, quota, and
user/team service wrappers. Fixture creation uses their non-HTTP service-identity
fallback to SQL, matching production bootstrap; HTTP requests exercise the
configured redirects.

Basic authentication and API key/service account token clients are registered.
Additional providers can be registered through `Environment.Authn`; cookie,
OAuth, anonymous, and external identity provider tests stay on the full harness
until their production dependencies are supplied. External services aren't
silently replaced with fake implementations.

## Use

```go
func TestMain(m *testing.M) {
    apiserver.Run(m)
}

func TestIntegrationMyAPI(t *testing.T) {
    testutil.SkipIntegrationTestInShortMode(t)
    t.Parallel()

    env := apiserver.New(t, apiserver.Options{
        Register: func(env *apiserver.Environment) {
            // Supply this API's dependencies, using production constructors.
            env.Registrar.RegisterAPI(service.NewServiceAPIBuilder())
            // App installers use env.Registrar.RegisterAppInstaller(installer).
        },
    })
    caller := env.CreateUser(t, &user.CreateUserCommand{
        Login: "reader", Password: user.Password("test-password"),
        DefaultOrgRole: string(org.RoleViewer),
    })
    client, err := dynamic.NewForConfig(env.ClientConfig(caller))
    require.NoError(t, err)
    // Keep existing resource requests and assertions here.
}
```

Use fresh builders/installers for each environment. Registration finishes before
startup. `Environment` supplies the database, resource client, user/org/team services,
access control, permission registry, feature toggles, tracer, registry, and
eventual loopback configuration for API dependencies. Constructors declare
fixed roles during registration; the harness registers/seeds them before
serving, as Grafana does.

`Configure` changes the instance config; `FeatureFlags` enables flags in both the
legacy feature service and production OpenFeature evaluations. `apiserver.Run(m)`
installs one provider before tests run; each environment supplies its own immutable
flag configuration through startup and HTTP request contexts, including loopback
requests. Parallel environments can enable different flags. Use
`env.Context(ctx)` for direct service calls outside HTTP handlers. Raw
`[feature_toggles]` configuration is also parsed by the production static provider.
Enable `cfg.EnableSearch` through `Configure` for the production
Bleve index and document builders. `ConfigureStorage` configures the production `sql.ServerOptions`, including
specialized search options. `InlineSecrets` injects a secure-value service.
The default access client is the production SQL-backed RBAC client. `AccessClient`
can override it explicitly when testing a different authorization backend.
All storage and API-group authorization still runs.

Do not replace the process OpenFeature provider or mutate shared configuration in
parallel tests. Packages mixing full Grafana startup retain its process-wide
provider ownership until fully migrated. Evaluations using an unrelated
`context.Background()` outside startup/HTTP handling still use process defaults;
those calls need an explicit environment context before differing flags can run
in parallel.

Use `env.GetResourceClient(t, ResourceClientArgs{User: caller, GVR: gvr})` for
standard Kubernetes resource operations; an omitted namespace uses the caller's
namespace. `List`, `DoRequest`, `LoadYAMLOrJSONFile`, `SanitizeJSON`, and
`GroupVersionInfoJSON` cover raw HTTP, fixture loading, stable JSON comparisons,
and discovery without importing the old `pkg/tests/apis` helpers. `CreateOrgUsers`
returns persisted `Admin`, `Editor`, `Viewer`, and `None` fixtures for one org;
`OrgUsersArgs.OrgID` selects the org (omitted means main). Admin is an org admin
unless `OrgUsersArgs.GrafanaAdmin` is explicitly set. For individual fixtures,
use `env.CreateUser`. Use the production
`Organizations.CreateWithMember` service for an explicit second organization;
`GetOrCreate` follows auto-assignment policy and can return the main organization.
Legacy HTTP facades can be registered through their production route
constructors, as the playlist suite does, without starting the full HTTP server.

## Migration

1. Keep tests in their current package and keep request/assertion bodies where
   possible. Replace startup with this harness and register the needed production
   APIs. Use existing fixture services against `env.DB`.
2. Retain full-server coverage for HTTP authentication, legacy route redirects,
   application wiring, and other behavior outside the API server.
3. Run the same cases before and after with `-count` and compare test elapsed
   times separately from compilation and process startup. Do not add timing
   assertions to correctness tests.
4. Require race-free repeated/shuffled runs and the database matrix before
   enabling parallelism in migrated suites.

The first migration is short URL API create/get and path validation in
`../apis/shorturl/shorturl_test.go`. Legacy visibility and redirects remain in
that package's full-server tests. `server_test.go` checks identical names and
persisted users in separate live environments using both a production builder
and an app installer. It also verifies watches terminate on server shutdown
without client cancellation, credential failures, role/organization
boundaries, and scoped SQL grants/revocation against both the loaded user
permissions and the production authorization client.

`../apis/playlist/playlist_test.go` is fully migrated, including its legacy HTTP
compatibility checks. It uses the production playlist installer and facade route
registration, the same fixtures and assertions, and no dependency on
`pkg/tests/apis`, `testinfra`, or `testsuite`.

`../apis/iam/user` is migrated in place across storage modes 0–5. It registers
the production IAM builder and legacy user HTTP routes, including their fixed
roles and deletion cleanup services. Modes and test functions own independent
environments and run in parallel. Search setup waits for observable results
instead of fixed sleeps. Explicit `iam.api` configuration selects startup APIs;
the original feature flags still control request-time redirects. The suite's
existing scoped-permission assertions detect missing caller ID-token sync.

## Validation

```sh
go test -race ./pkg/tests/apiserver ./pkg/tests/apis/shorturl -run 'TestIntegration(Isolation|AuthenticationAndAuthorization|WatchShutdown|ShortURLAPI)' -shuffle=on -count=10
go test -race ./pkg/tests/apis/iam/user ./pkg/tests/apiserver ./pkg/tests/apis/playlist -shuffle=on -count=3 -timeout=10m
GRAFANA_TEST_DB=sqlite go test ./pkg/tests/apiserver ./pkg/tests/apis/shorturl -count=1
GRAFANA_TEST_DB=mysql go test ./pkg/tests/apiserver ./pkg/tests/apis/shorturl -run 'TestIntegration(Isolation|AuthenticationAndAuthorization|WatchShutdown|ShortURLAPI)' -count=1
GRAFANA_TEST_DB=postgres go test ./pkg/tests/apiserver ./pkg/tests/apis/shorturl -run 'TestIntegration(Isolation|AuthenticationAndAuthorization|WatchShutdown|ShortURLAPI)' -count=1
```

MySQL and PostgreSQL use the same `MYSQL_*` / `POSTGRES_*` test connection
settings as `db.NewTestStore`. See `contribute/backend/style-guide.md` for SQL
matrix naming and short-mode conventions. The harness also works in packages
that still have a legacy `testsuite.Run` while migration is in progress.

References: [Go parallel tests](https://pkg.go.dev/testing#T.Parallel),
[Go HTTP testing](https://pkg.go.dev/net/http/httptest).

## Initial measurement

On this laptop, SQLite validation through the original full-Grafana helper took
0.65–1.00 s across three runs (median 0.80 s). The migrated API test, including
persisted credentials, create/get, and cross-organization denial, took 0.23–0.44 s
across five final runs (median 0.27 s). These are test start-to-finish times excluding
compilation, not a promise for other suites. Remaining legacy short URL checks
share one full server, so this pilot does not add a second full-server startup.

The same authentication, permission grant/revocation, and isolation cases were
also exercised against MySQL and PostgreSQL. Generalize the design through the
registrar and dependency hooks; migrate another suite only after preserving its
permission assertions and measuring its own runtime.

The complete active playlist suite took 0.97–1.14 s on the original harness
across three SQLite runs (median 1.07 s). After migration it took 0.32–0.51 s
across five runs (median 0.35 s), about 3× faster. This retains the pre-existing
skipped case; no additional cases were skipped. The suite also passed ten
shuffled race runs and three shuffled runs each on MySQL and PostgreSQL.

One complete IAM user package run before and after migration, excluding
compilation, gave the following results. Each database retained the same 349
passing test events and one existing skip (parent tests are included in that
count).

| Database | Original | Isolated | Speedup |
| --- | ---: | ---: | ---: |
| SQLite | 105.589 s | 17.933 s | 5.89× |
| MySQL | 140.841 s | 12.676 s | 11.11× |
| PostgreSQL | 143.761 s | 14.692 s | 9.78× |

These are individual package elapsed measurements, including setup and cleanup;
they are not statistical estimates. The command was
`go test -json ./pkg/tests/apis/iam/user -count=1 -timeout=10m`, with the
corresponding `GRAFANA_TEST_DB` and database connection settings.

package v2beta1

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

// Guards "absent field = inherit": a CUE default would make the generated constructors write a value.
func TestNewDashboardSettingsSpecHasNoDefaults(t *testing.T) {
	for _, v := range []any{NewDashboardSettingsSpec(), NewDashboardSettings().Spec, NewDashboardSettingsPanelDefaults()} {
		b, err := json.Marshal(v)
		require.NoError(t, err)
		require.JSONEq(t, `{}`, string(b))
	}
}

func TestDashboardSettingsResourceInfo(t *testing.T) {
	require.Equal(t, schema.GroupVersionResource{Group: "dashboard.grafana.app", Version: "v2beta1", Resource: "dashboardsettings"}, DashboardSettingsResourceInfo.GroupVersionResource())
	require.Equal(t, "dashboardsettings", DashboardSettingsResourceInfo.GetSingularName())
	require.Equal(t, "DashboardSettings", DashboardSettingsResourceInfo.GroupVersionKind().Kind)
}

func TestDashboardSettingsNames(t *testing.T) {
	require.Equal(t, "namespace", DashboardSettingsOrgName)
	require.Equal(t, "folder-a--b", DashboardSettingsFolderName("a--b"))
	require.Equal(t, "user-u1", DashboardSettingsUserName("u1"))
}

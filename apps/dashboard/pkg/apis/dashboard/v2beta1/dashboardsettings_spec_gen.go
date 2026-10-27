// Code generated - EDITING IS FUTILE. DO NOT EDIT.

package v2beta1

// Grafana owns this vocabulary; each plugin maps it onto its own options and ignores keys it does
// not use. Keys are only ever added.
// +k8s:openapi-gen=true
type DashboardSettingsPanelDefaults struct {
	Width           *float64                                       `json:"width,omitempty"`
	LegendPlacement *DashboardSettingsPanelDefaultsLegendPlacement `json:"legendPlacement,omitempty"`
	TooltipMode     *DashboardSettingsPanelDefaultsTooltipMode     `json:"tooltipMode,omitempty"`
	AxisScale       *DashboardSettingsPanelDefaultsAxisScale       `json:"axisScale,omitempty"`
	// Number of decimal places, 0 to 15.
	Decimals *int64 `json:"decimals,omitempty"`
}

// NewDashboardSettingsPanelDefaults creates a new DashboardSettingsPanelDefaults object.
func NewDashboardSettingsPanelDefaults() *DashboardSettingsPanelDefaults {
	return &DashboardSettingsPanelDefaults{}
}

// OpenAPIModelName returns the OpenAPI model name for DashboardSettingsPanelDefaults.
func (DashboardSettingsPanelDefaults) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.dashboard.pkg.apis.dashboard.v2beta1.DashboardSettingsPanelDefaults"
}

// +k8s:openapi-gen=true
type DashboardSettingsSpec struct {
	// Owner of a user tier object ("user-<userUID>"). Unset on org and folder objects.
	UserUID *string `json:"userUID,omitempty"`
	Preload *bool   `json:"preload,omitempty"`
	// An empty string turns auto refresh off.
	AutoRefresh *string                                `json:"autoRefresh,omitempty"`
	TimeRange   *DashboardSettingsV2beta1SpecTimeRange `json:"timeRange,omitempty"`
	// Same values as the dashboard's cursorSync.
	CursorSync *DashboardSettingsSpecCursorSync `json:"cursorSync,omitempty"`
	Layout     *DashboardSettingsSpecLayout     `json:"layout,omitempty"`
	Panels     *DashboardSettingsPanelDefaults  `json:"panels,omitempty"`
}

// NewDashboardSettingsSpec creates a new DashboardSettingsSpec object.
func NewDashboardSettingsSpec() *DashboardSettingsSpec {
	return &DashboardSettingsSpec{}
}

// OpenAPIModelName returns the OpenAPI model name for DashboardSettingsSpec.
func (DashboardSettingsSpec) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.dashboard.pkg.apis.dashboard.v2beta1.DashboardSettingsSpec"
}

// +k8s:openapi-gen=true
type DashboardSettingsV2beta1SpecTimeRange struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// NewDashboardSettingsV2beta1SpecTimeRange creates a new DashboardSettingsV2beta1SpecTimeRange object.
func NewDashboardSettingsV2beta1SpecTimeRange() *DashboardSettingsV2beta1SpecTimeRange {
	return &DashboardSettingsV2beta1SpecTimeRange{}
}

// OpenAPIModelName returns the OpenAPI model name for DashboardSettingsV2beta1SpecTimeRange.
func (DashboardSettingsV2beta1SpecTimeRange) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.dashboard.pkg.apis.dashboard.v2beta1.DashboardSettingsV2beta1SpecTimeRange"
}

// +k8s:openapi-gen=true
type DashboardSettingsPanelDefaultsLegendPlacement string

const (
	DashboardSettingsPanelDefaultsLegendPlacementBottom DashboardSettingsPanelDefaultsLegendPlacement = "bottom"
	DashboardSettingsPanelDefaultsLegendPlacementRight  DashboardSettingsPanelDefaultsLegendPlacement = "right"
)

// OpenAPIModelName returns the OpenAPI model name for DashboardSettingsPanelDefaultsLegendPlacement.
func (DashboardSettingsPanelDefaultsLegendPlacement) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.dashboard.pkg.apis.dashboard.v2beta1.DashboardSettingsPanelDefaultsLegendPlacement"
}

// +k8s:openapi-gen=true
type DashboardSettingsPanelDefaultsTooltipMode string

const (
	DashboardSettingsPanelDefaultsTooltipModeSingle DashboardSettingsPanelDefaultsTooltipMode = "single"
	DashboardSettingsPanelDefaultsTooltipModeMulti  DashboardSettingsPanelDefaultsTooltipMode = "multi"
	DashboardSettingsPanelDefaultsTooltipModeNone   DashboardSettingsPanelDefaultsTooltipMode = "none"
)

// OpenAPIModelName returns the OpenAPI model name for DashboardSettingsPanelDefaultsTooltipMode.
func (DashboardSettingsPanelDefaultsTooltipMode) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.dashboard.pkg.apis.dashboard.v2beta1.DashboardSettingsPanelDefaultsTooltipMode"
}

// +k8s:openapi-gen=true
type DashboardSettingsPanelDefaultsAxisScale string

const (
	DashboardSettingsPanelDefaultsAxisScaleLinear DashboardSettingsPanelDefaultsAxisScale = "linear"
	DashboardSettingsPanelDefaultsAxisScaleLog2   DashboardSettingsPanelDefaultsAxisScale = "log2"
	DashboardSettingsPanelDefaultsAxisScaleLog10  DashboardSettingsPanelDefaultsAxisScale = "log10"
)

// OpenAPIModelName returns the OpenAPI model name for DashboardSettingsPanelDefaultsAxisScale.
func (DashboardSettingsPanelDefaultsAxisScale) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.dashboard.pkg.apis.dashboard.v2beta1.DashboardSettingsPanelDefaultsAxisScale"
}

// +k8s:openapi-gen=true
type DashboardSettingsSpecCursorSync string

const (
	DashboardSettingsSpecCursorSyncOff       DashboardSettingsSpecCursorSync = "Off"
	DashboardSettingsSpecCursorSyncCrosshair DashboardSettingsSpecCursorSync = "Crosshair"
	DashboardSettingsSpecCursorSyncTooltip   DashboardSettingsSpecCursorSync = "Tooltip"
)

// OpenAPIModelName returns the OpenAPI model name for DashboardSettingsSpecCursorSync.
func (DashboardSettingsSpecCursorSync) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.dashboard.pkg.apis.dashboard.v2beta1.DashboardSettingsSpecCursorSync"
}

// +k8s:openapi-gen=true
type DashboardSettingsSpecLayout string

const (
	DashboardSettingsSpecLayoutGridLayout     DashboardSettingsSpecLayout = "GridLayout"
	DashboardSettingsSpecLayoutAutoGridLayout DashboardSettingsSpecLayout = "AutoGridLayout"
)

// OpenAPIModelName returns the OpenAPI model name for DashboardSettingsSpecLayout.
func (DashboardSettingsSpecLayout) OpenAPIModelName() string {
	return "com.github.grafana.grafana.apps.dashboard.pkg.apis.dashboard.v2beta1.DashboardSettingsSpecLayout"
}

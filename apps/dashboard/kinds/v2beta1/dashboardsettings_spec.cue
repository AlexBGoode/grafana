package v2beta1

import (
	"strings"
)

// Nothing here has a CUE default or references dashboard_spec.cue, because the generated Go New*()
// and TS default*() constructors would write those defaults into new objects (DashboardCursorSync
// defaults to "Off").

// Defaults for new dashboards and panels at one tier: org, folder or user. Every field is optional; an absent field inherits from the next tier.
DashboardSettingsSpec: {
	// Owner of a user tier object ("user-<userUID>"). Unset on org and folder objects.
	userUID?: string

	preload?: bool
	// An empty string turns auto refresh off.
	autoRefresh?: string
	timeRange?: {
		from: string & strings.MinRunes(1)
		to:   string & strings.MinRunes(1)
	}
	// Same values as the dashboard's cursorSync.
	cursorSync?: "Off" | "Crosshair" | "Tooltip"
	layout?:     "GridLayout" | "AutoGridLayout"

	panels?: PanelDefaults
}

// Grafana owns this vocabulary; each plugin maps it onto its own options and ignores keys it does
// not use. Keys are only ever added.
PanelDefaults: {
	width?:           number
	legendPlacement?: "bottom" | "right"
	tooltipMode?:     "single" | "multi" | "none"
	axisScale?:       "linear" | "log2" | "log10"

	// Codegen renders `int & >=0` as uint, which generates *uint64 and drops the lower bound from
	// the schema; `>-1` keeps an int64 field and a minimum.

	// Number of decimal places, 0 to 15.
	decimals?: int & >-1 & <=15
}

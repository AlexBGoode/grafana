// Code generated - EDITING IS FUTILE. DO NOT EDIT.

/**
 * Grafana owns this vocabulary; each plugin maps it onto its own options and ignores keys it does
 * not use. Keys are only ever added.
 */
export interface PanelDefaults {
	width?: number;
	legendPlacement?: "bottom" | "right";
	tooltipMode?: "single" | "multi" | "none";
	axisScale?: "linear" | "log2" | "log10";
	// Number of decimal places, 0 to 15.
	decimals?: number;
}

export const defaultPanelDefaults = (): PanelDefaults => ({
});

export interface Spec {
	// Owner of a user tier object ("user-<userUID>"). Unset on org and folder objects.
	userUID?: string;
	preload?: boolean;
	// An empty string turns auto refresh off.
	autoRefresh?: string;
	timeRange?: {
		from: string;
		to: string;
	};
	// Same values as the dashboard's cursorSync.
	cursorSync?: "Off" | "Crosshair" | "Tooltip";
	layout?: "GridLayout" | "AutoGridLayout";
	panels?: PanelDefaults;
}

export const defaultSpec = (): Spec => ({
});


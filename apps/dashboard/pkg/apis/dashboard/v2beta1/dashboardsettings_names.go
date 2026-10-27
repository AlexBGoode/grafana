package v2beta1

// The metadata.name of a DashboardSettings object is derived from its tier. The helpers live in the
// API package so that the folder, IAM and settings-service packages can build names without
// importing the dashboard registry.

// DashboardSettingsOrgName is the name of the org tier object.
const DashboardSettingsOrgName = "namespace"

// DashboardSettingsFolderName is the name of the folder tier object for the folder with the given UID.
// folderUID must not be a root folder UID ("" or "general"): root-level settings live in the org tier object, DashboardSettingsOrgName.
func DashboardSettingsFolderName(folderUID string) string {
	return "folder-" + folderUID
}

// DashboardSettingsUserName is the name of the user tier object for the user with the given UID.
func DashboardSettingsUserName(userUID string) string {
	return "user-" + userUID
}

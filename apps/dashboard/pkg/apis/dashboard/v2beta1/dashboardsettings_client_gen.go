package v2beta1

import (
	"context"

	"github.com/grafana/grafana-app-sdk/resource"
)

type DashboardSettingsClient struct {
	client *resource.TypedClient[*DashboardSettings, *DashboardSettingsList]
}

func NewDashboardSettingsClient(client resource.Client) *DashboardSettingsClient {
	return &DashboardSettingsClient{
		client: resource.NewTypedClient[*DashboardSettings, *DashboardSettingsList](client, DashboardSettingsKind()),
	}
}

func NewDashboardSettingsClientFromGenerator(generator resource.ClientGenerator) (*DashboardSettingsClient, error) {
	c, err := generator.ClientFor(DashboardSettingsKind())
	if err != nil {
		return nil, err
	}
	return NewDashboardSettingsClient(c), nil
}

func (c *DashboardSettingsClient) Get(ctx context.Context, identifier resource.Identifier) (*DashboardSettings, error) {
	return c.client.Get(ctx, identifier)
}

func (c *DashboardSettingsClient) List(ctx context.Context, namespace string, opts resource.ListOptions) (*DashboardSettingsList, error) {
	return c.client.List(ctx, namespace, opts)
}

func (c *DashboardSettingsClient) ListAll(ctx context.Context, namespace string, opts resource.ListOptions) (*DashboardSettingsList, error) {
	resp, err := c.client.List(ctx, namespace, resource.ListOptions{
		ResourceVersion: opts.ResourceVersion,
		Limit:           opts.Limit,
		LabelFilters:    opts.LabelFilters,
		FieldSelectors:  opts.FieldSelectors,
	})
	if err != nil {
		return nil, err
	}
	for resp.GetContinue() != "" {
		page, err := c.client.List(ctx, namespace, resource.ListOptions{
			Continue:        resp.GetContinue(),
			ResourceVersion: opts.ResourceVersion,
			Limit:           opts.Limit,
			LabelFilters:    opts.LabelFilters,
			FieldSelectors:  opts.FieldSelectors,
		})
		if err != nil {
			return nil, err
		}
		resp.SetContinue(page.GetContinue())
		resp.SetResourceVersion(page.GetResourceVersion())
		resp.SetItems(append(resp.GetItems(), page.GetItems()...))
	}
	return resp, nil
}

func (c *DashboardSettingsClient) Create(ctx context.Context, obj *DashboardSettings, opts resource.CreateOptions) (*DashboardSettings, error) {
	// Make sure apiVersion and kind are set
	obj.APIVersion = GroupVersion.Identifier()
	obj.Kind = DashboardSettingsKind().Kind()
	return c.client.Create(ctx, obj, opts)
}

func (c *DashboardSettingsClient) Update(ctx context.Context, obj *DashboardSettings, opts resource.UpdateOptions) (*DashboardSettings, error) {
	return c.client.Update(ctx, obj, opts)
}

func (c *DashboardSettingsClient) Patch(ctx context.Context, identifier resource.Identifier, req resource.PatchRequest, opts resource.PatchOptions) (*DashboardSettings, error) {
	return c.client.Patch(ctx, identifier, req, opts)
}

func (c *DashboardSettingsClient) Delete(ctx context.Context, identifier resource.Identifier, opts resource.DeleteOptions) error {
	return c.client.Delete(ctx, identifier, opts)
}

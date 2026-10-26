import { type ComponentProps } from 'react';
import { render, screen, within } from 'test/test-utils';

import { FolderListRow } from './FolderListRow';

type RowProps = ComponentProps<typeof FolderListRow>;

function rowUi(overrides: Partial<RowProps> = {}) {
  const props: RowProps = {
    folderUid: 'root',
    title: 'Root',
    kind: 'alert',
    parents: [],
    count: { status: 'loaded', count: 2 },
    expanded: false,
    onToggle: jest.fn(),
    ...overrides,
  };

  return (
    <ul>
      <FolderListRow {...props} />
    </ul>
  );
}

function renderRow(overrides: Partial<RowProps> = {}) {
  return render(rowUi(overrides));
}

describe('FolderListRow', () => {
  it('shows the own title as a link, the parent path for a nested folder, and the pluralized count', () => {
    renderRow({
      folderUid: 'k8s',
      title: 'Kubernetes',
      parents: ['Platform', 'Infra'],
      count: { status: 'loaded', count: 21 },
    });

    expect(screen.getByRole('link', { name: 'Kubernetes' })).toHaveAttribute(
      'href',
      '/dashboards/f/k8s/kubernetes/alerting'
    );
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Infra')).toBeInTheDocument();
    expect(screen.getAllByText('Kubernetes')).toHaveLength(1);
    expect(screen.getByText('21 alert rules')).toBeInTheDocument();
  });

  it('labels the count for the rule kind it is given', () => {
    renderRow({ kind: 'recording', count: { status: 'loaded', count: 1 } });

    expect(screen.getByText('1 recording rule')).toBeInTheDocument();
  });

  it('toggles through the chevron button and renders children only while expanded', async () => {
    const onToggle = jest.fn();
    const children = <li>child rule</li>;
    const { user, rerender } = renderRow({ onToggle, children });

    expect(screen.queryByText('child rule')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand Root' }));
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(rowUi({ onToggle, children, expanded: true }));
    expect(screen.getByRole('button', { name: 'Collapse Root' })).toHaveAttribute('aria-expanded', 'true');
    // The child rules form a list of their own inside the folder's row, not a role-overridden one.
    const folderRow = screen.getAllByRole('listitem')[0];
    expect(within(folderRow).getByRole('list')).toHaveTextContent('child rule');
  });

  it('names the count with its explanation, so it is not only a hover tooltip', () => {
    renderRow({ count: { status: 'loaded', count: 3 } });

    expect(
      screen.getByRole('img', {
        name: '3 alert rules. Rules directly in this folder. Subfolders are listed separately.',
      })
    ).toHaveTextContent('3 alert rules');
  });

  it('explains on hover that the count covers only rules directly in the folder', async () => {
    const { user } = renderRow({ count: { status: 'loaded', count: 2 } });

    await user.hover(screen.getByText('2 alert rules'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Rules directly in this folder. Subfolders are listed separately.'
    );
  });
});

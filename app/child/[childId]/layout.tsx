import { ChildPageFrame } from '@/app/child/_components/ChildSidebar';

export default async function ChildWorldLayout(props: LayoutProps<'/child/[childId]'>) {
  const { childId } = await props.params;
  return <ChildPageFrame childId={childId}>{props.children}</ChildPageFrame>;
}

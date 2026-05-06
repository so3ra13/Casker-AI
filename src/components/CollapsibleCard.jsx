import { useState } from 'react';
import { CardWrap, CardHeader, CardBody, Badge, Chevron } from '@/theme';
import { Btn } from '@/theme';
import Tooltip from '@/components/Tooltip';

export default function CollapsibleCard({ badge, title, count, onDetail, detailLabel = '⟫ 세부조정', tooltip, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <CardWrap>
      <CardHeader $collapsed={!open} onClick={() => setOpen(o => !o)}>
        <Badge $type={badge}>{badge}</Badge>
        <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>{title}</span>
        {tooltip && (
          <Tooltip
            title={tooltip.title}
            desc={tooltip.desc}
            code={tooltip.code}
            badge={badge}
          />
        )}
        {count !== undefined && (
          <span style={{ fontSize: 9, color: 'var(--tx3)', marginRight: 2 }}>{count}개</span>
        )}
        {onDetail && (
          <Btn
            $variant="detail"
            onClick={e => { e.stopPropagation(); onDetail(); }}
            style={{ padding: '3px 7px' }}
          >
            {detailLabel}
          </Btn>
        )}
        <Chevron $open={open}>▶</Chevron>
      </CardHeader>
      <CardBody $hidden={!open}>
        {children}
      </CardBody>
    </CardWrap>
  );
}

'use client';

import { Collapse } from 'antd';
import { Criteria } from '@/types/studentscorepage';
import CampaignAccordion from '@/components/student.studentscore/CampaignAccordion';

type Props = {
  criteria: Criteria[];
};

export default function CriteriaAccordion({ criteria }: Props) {
  console.log('CriteriaAccordion received criteria:', criteria);
  
  return (
    <div>
      {criteria.map((cri, idx) =>
        <Collapse key={cri.id} className="mb-3" defaultActiveKey={['1']}>
          <Collapse.Panel
            header={
              <span className="font-semibold">
                {idx + 1}. {cri.name} <span className="ml-2 text-blue-700">[{cri.max_score}]</span>
                <span className="ml-4 text-red-600">Tổng điểm tiêu chí: {cri.total_score} / {cri.max_score}</span>
              </span>
            }
            key={cri.id}
          >
            <CampaignAccordion campaigns={cri.campaigns} />
          </Collapse.Panel>
        </Collapse>
      )}
    </div>
  );
}

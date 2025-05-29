'use client';

import { Collapse } from 'antd';
import { Campaign } from '@/types/studentscorepage';
import ActivityTable from '@/components/student.studentscore/student.ActivityTable';

type Props = {
  campaigns: Campaign[];
};

export default function CampaignAccordion({ campaigns }: Props) {
  console.log('CampaignAccordion received campaigns:', campaigns);
  console.log('Number of campaigns:', campaigns.length);
  
  return (
    <Collapse defaultActiveKey={['1']} className="mb-2">
      {campaigns.map((camp, idx) => {
        console.log(`Campaign ${idx}:`, camp);
        return (
          <Collapse.Panel
            header={
              <span className="font-medium text-blue-800">
                {idx + 1}. {camp.name}
                <span className="ml-3 text-blue-500">
                  Tổng điểm phong trào: {camp.total_score} / {camp.max_score}
                </span>
              </span>
            }
            key={camp.id}
          >
            <ActivityTable
              activities={camp.activities}
              totalScore={camp.total_score}
              maxScore={camp.max_score}
              campaignIndex={idx}
            />
          </Collapse.Panel>
        );
      })}
    </Collapse>
  );
}

import React from 'react';
import { PromptInputBox } from './ai-prompt-box';

interface DemoOneProps {
  isLoading?: boolean;
  onSendText: (message: string) => void;
  onSendAudio: (file: Blob | File, filename: string) => void;
}

const DemoOne: React.FC<DemoOneProps> = ({ isLoading = false, onSendText, onSendAudio }) => {
  return (
    <div className='flex w-full min-h-screen justify-center items-center bg-[radial-gradient(125%_125%_at_50%_101%,rgba(245,87,2,1)_10.5%,rgba(245,120,2,1)_16%,rgba(245,140,2,1)_17.5%,rgba(245,170,100,1)_25%,rgba(238,174,202,1)_40%,rgba(202,179,214,1)_65%,rgba(148,201,233,1)_100%)] px-4'>
      <div className='w-full max-w-[620px]'>
        <PromptInputBox onSendText={onSendText} onSendAudio={onSendAudio} isLoading={isLoading} />
      </div>
    </div>
  );
};

export { DemoOne };

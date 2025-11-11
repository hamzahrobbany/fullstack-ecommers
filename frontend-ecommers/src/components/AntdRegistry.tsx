'use client';

import React from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { createCache, StyleProvider } from '@ant-design/cssinjs';

export default function AntdRegistry({ children }: { children: React.ReactNode }) {
  const cache = React.useMemo(() => createCache(), []);

  useServerInsertedHTML(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const styleText = (cache as any).getStyleText?.() || '';
    return (
      <style
        id="antd"
        dangerouslySetInnerHTML={{ __html: styleText }}
      />
    );
  });

  return <StyleProvider cache={cache}>{children}</StyleProvider>;
}

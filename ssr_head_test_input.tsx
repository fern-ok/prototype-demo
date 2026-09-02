import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Check, ChevronDown, ChevronRight, Download, Info, Plus, RefreshCw, Search, SlidersHorizontal, Upload, X } from 'lucide-react';
import { RelateCatalogModal } from './src/prototypes/data-resource-catalog/index.tsx';

const seeds = [
  { id: 1, name: '湖南省户籍人口基础信息资源目录', domain: '公安', summary: '户籍人口基础信息' },
  { id: 2, name: '湖南省医保结算数据资源目录', domain: '医保', summary: '医保结算数据' },
  { id: 3, name: '湖南省市场主体登记数据资源目录', domain: '市场监管', summary: '市场主体登记信息' },
];

const A = (
  <RelateCatalogModal
    initialSelected={[]}
    initialAssociated={[seeds[0], seeds[1]]}
    onClose={() => {}}
    onConfirm={() => {}}
  />
);

const B = (
  <RelateCatalogModal
    initialSelected={[]}
    initialAssociated={[]}
    onClose={() => {}}
    onConfirm={() => {}}
  />
);

for (const [label, el] of [['A: 2 initial + 0 selection', A], ['B: 0 initial + 0 selection', B]]) {
  try {
    const html = renderToStaticMarkup(el);
    console.log('=== ' + label + ' ===');
    console.log('len=' + html.length);
    console.log('has_label:', html.includes('已关联政务信息资源目录'));
    console.log('has_chip_class:', html.includes('head-associated-chip'));
    console.log('RENDER_OK');
  } catch (e) {
    console.log('=== ' + label + ' ===');
    console.log('CRASH:', e.message);
  }
}
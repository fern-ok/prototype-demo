/**
 * @name 资源授权单查看弹窗（公共组件）
 * @mode axure
 *
 * 数据资源授权/申请、数据资源初审、数据资源复审页面共用的查看弹窗
 * - 申请信息/审核信息双页签 + 右上角【查看存证】
 * - isOperator=true 展示运营机构版式（基本信息 + 数据资源申请信息）
 * - isOperator=false 展示实施机构版式（授权信息平铺栅格）
 * - 审核信息页签展示流程节点表（提交申请、初审、复审）
 */

import { useState } from 'react';
import { Paperclip, ShieldCheck } from 'lucide-react';
import './auth-record-view.css';

export interface AuthViewRecord {
  authName: string;
  initiator?: string;
  unitName?: string;
  createTime?: string;
  reviewResult?: string;
  reviewOpinion?: string;
  reviewer?: string;
  reviewTime?: string;
  recheckResult?: string;
  recheckOpinion?: string;
  recheckReviewer?: string;
  recheckTime?: string;
  evidenceHash?: string;
  evidenceTime?: string;
}

interface AuthRecordViewModalProps {
  record: AuthViewRecord | null;
  /** true=运营机构版式，false=实施机构版式（由调用方按角色或授权发起方决定） */
  isOperator: boolean;
  onClose: () => void;
}

const AuthRecordViewModal = ({ record, isOperator, onClose }: AuthRecordViewModalProps) => {
  const [viewTab, setViewTab] = useState<'apply' | 'review'>('apply');
  const [showEvidence, setShowEvidence] = useState(false);

  const agentName = isOperator ? '田惠美' : '湖南省卫生健康委信息统计中心';
  const reviewUnit = isOperator ? '湖南省政务服务和大数据中心' : '湖南数据产业集团有限公司';
  const applyUnit = record?.unitName || (isOperator ? '湖南省数据产业有限公司' : '湖南省卫生健康委信息统计中心');
  const resources = isOperator
    ? [{ id: 1, resourceName: '省整体数据资源0604', industry: '综合医院', platform: '可信数据空间' }]
    : [{ id: 1, resourceName: '省级卫生健康资源0709-4', industry: '烟煤和无烟煤开采洗选', platform: '数据开发中心' }];

  const flowNodes = [
    {
      id: 1,
      node: '提交申请',
      status: '已完成',
      unitName: applyUnit,
      agent: agentName,
      time: record?.createTime || '—',
      result: '—',
      opinion: '—'
    },
    {
      id: 2,
      node: '初审',
      status: record?.reviewResult ? '已完成' : '待审核',
      unitName: record?.reviewResult ? reviewUnit : '—',
      agent: record?.reviewResult ? reviewUnit : '—',
      time: record?.reviewTime || '—',
      result: record?.reviewResult || '—',
      opinion: record?.reviewOpinion || '—'
    },
    {
      id: 3,
      node: '复审',
      status: record?.recheckResult ? '已完成' : '待审核',
      unitName: record?.recheckResult ? reviewUnit : '—',
      agent: record?.recheckResult ? reviewUnit : '—',
      time: record?.recheckTime || '—',
      result: record?.recheckResult || '—',
      opinion: record?.recheckOpinion || '—'
    }
  ];

  const renderResourceTable = () => (
    <div className="desc-resource">
      <table className="data-table desc-resource-table">
        <thead>
          <tr>
            <th className="col-index">序号</th>
            <th>资源名称</th>
            <th>行业分类</th>
            <th>数据源挂载平台</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((item, idx) => (
            <tr key={item.id}>
              <td className="col-index">{idx + 1}</td>
              <td>{item.resourceName}</td>
              <td>{item.industry}</td>
              <td>{item.platform}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="desc-pager">
        <span className="pagination-info">共{resources.length}条记录</span>
        <div className="pagination-controls">
          <button className="page-btn" disabled>上一页</button>
          <button className="page-number active">1</button>
          <button className="page-btn" disabled>下一页</button>
          <select className="page-size-select" value={10} onChange={() => { }}>
            <option value={10}>10 条/页</option>
          </select>
          <span className="jump-to">跳至</span>
          <input className="page-input" type="number" value={1} readOnly />
          <span className="jump-to">页</span>
        </div>
      </div>
    </div>
  );

  const renderApplyInfo = () => {
    if (isOperator) {
      return (
        <>
          <div className="section-title"><span className="title-bar"></span>基本信息</div>
          <div className="view-desc-grid">
            <div className="desc-label">资源授权单名称</div>
            <div className="desc-value">{record?.authName}</div>
            <div className="desc-label">运营机构经办人</div>
            <div className="desc-value">田惠美</div>
            <div className="desc-label">运营机构经办人电话</div>
            <div className="desc-value">18385999561</div>
            <div className="desc-label">领域名称</div>
            <div className="desc-value">整体</div>
            <div className="desc-label">实施机构</div>
            <div className="desc-value">湖南省政务服务和大数据中心</div>
            <div className="desc-label">运营机构</div>
            <div className="desc-value">湖南省数据产业有限公司</div>
            <div className="desc-label">授权期限</div>
            <div className="desc-value">2026-01-26 至 2026-02-28</div>
            <div className="desc-label">运营协议</div>
            <div className="desc-value">
              <span className="file-chip"><Paperclip size={12} />运营协议.pdf</span>
              <ShieldCheck size={14} className="file-shield" />
            </div>
            <div className="desc-label">实施方案</div>
            <div className="desc-value">
              <span className="file-chip"><Paperclip size={12} />实施方案.pdf</span>
              <ShieldCheck size={14} className="file-shield" />
            </div>
            <div className="desc-label">产品和服务清单</div>
            <div className="desc-value"><button type="button" className="text-link">查看</button></div>
            <div className="desc-label">申请说明</div>
            <div className="desc-value desc-value-full">—</div>
          </div>
          <div className="section-title" style={{ marginTop: '18px' }}><span className="title-bar"></span>数据资源申请信息</div>
          <div className="view-desc-grid">
            <div className="desc-label">产品开发方案</div>
            <div className="desc-value desc-value-full">
              <span className="file-chip"><Paperclip size={12} />证书.pdf</span>
              <ShieldCheck size={14} className="file-shield" />
            </div>
            <div className="desc-label">本次申请的数据资源</div>
            <div className="desc-value desc-value-full desc-value-table">{renderResourceTable()}</div>
          </div>
        </>
      );
    }
    return (
      <div className="view-desc-grid">
        <div className="desc-label">资源授权单名称</div>
        <div className="desc-value">{record?.authName}</div>
        <div className="desc-label">法人经办人姓名</div>
        <div className="desc-value">湖南省卫生健康委信息统计中心</div>
        <div className="desc-label">授权运营类型</div>
        <div className="desc-value">分领域授权运营</div>
        <div className="desc-label">领域名称</div>
        <div className="desc-value">医疗健康</div>
        <div className="desc-label">实施机构</div>
        <div className="desc-value">湖南省卫生健康委信息统计中心</div>
        <div className="desc-label">运营机构</div>
        <div className="desc-value">湖南数据产业集团有限公司</div>
        <div className="desc-label">授权期限</div>
        <div className="desc-value">2026-08-26 至 2026-12-28</div>
        <div className="desc-label">运营协议</div>
        <div className="desc-value">
          <span className="file-chip"><Paperclip size={12} />通用协议文件 (4).pdf</span>
          <ShieldCheck size={14} className="file-shield" />
        </div>
        <div className="desc-label">实施方案</div>
        <div className="desc-value">
          <span className="file-chip" title="卫健委-卫生健康领域-实施方案 - 非联审.pdf"><Paperclip size={12} />卫健委-卫生健康领域-实施方案 - 非联….pdf</span>
          <ShieldCheck size={14} className="file-shield" />
        </div>
        <div className="desc-label">产品和服务清单</div>
        <div className="desc-value"><button type="button" className="text-link">查看</button></div>
        <div className="desc-label">本次授权的数据资源</div>
        <div className="desc-value desc-value-full desc-value-table">{renderResourceTable()}</div>
      </div>
    );
  };

  const renderReviewInfo = () => (
    <table className="data-table review-flow-table">
      <thead>
        <tr>
          <th className="col-index">序号</th>
          <th>流程节点</th>
          <th>节点状态</th>
          <th>单位名称</th>
          <th>法人经办人姓名</th>
          <th>操作时间</th>
          <th>审核结果</th>
          <th>审核意见</th>
        </tr>
      </thead>
      <tbody>
        {flowNodes.map(node => (
          <tr key={node.id}>
            <td className="col-index">{node.id}</td>
            <td>{node.node}</td>
            <td>
              <span className={'status-tag ' + (node.status === '已完成' ? 'status-approved' : 'status-pending')}>{node.status}</span>
            </td>
            <td className="cell-ellipsis" title={node.unitName}>{node.unitName}</td>
            <td className="cell-ellipsis" title={node.agent}>{node.agent}</td>
            <td className="cell-ellipsis" title={node.time}>{node.time}</td>
            <td>
              {node.result === '—' ? '—' : (
                <span style={{ color: node.result.includes('不通过') ? '#d54941' : '#179b55' }}>{node.result}</span>
              )}
            </td>
            <td className="cell-ellipsis" title={node.opinion}>{node.opinion}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderEvidenceModal = () => (
    <div className="modal-overlay" onClick={() => setShowEvidence(false)}>
      <div className="modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>区块链存证信息</h3>
          <button className="modal-close" onClick={() => setShowEvidence(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="view-info-grid">
            <div className="info-row">
              <div className="info-label">资源授权单名称</div>
              <div className="info-value">{record?.authName}</div>
            </div>
            <div className="info-row">
              <div className="info-label">存证状态</div>
              <div className="info-value"><span className="status-tag status-approved">已上链</span></div>
            </div>
            <div className="info-row">
              <div className="info-label">区块链网络</div>
              <div className="info-value">公共数据资源授权链</div>
            </div>
            <div className="info-row">
              <div className="info-label">区块高度</div>
              <div className="info-value">#{Math.floor(Math.random() * 1000000) + 500000}</div>
            </div>
            <div className="info-row">
              <div className="info-label">交易哈希</div>
              <div className="info-value" style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{record?.evidenceHash || '0x' + 'a'.repeat(64)}</div>
            </div>
            <div className="info-row">
              <div className="info-label">存证时间</div>
              <div className="info-value">{record?.evidenceTime || record?.reviewTime || '—'}</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: '#f5f7fb', borderRadius: '4px', color: '#4b5563', fontSize: '12px', lineHeight: '1.6' }}>
            <strong>存证说明：</strong>本次资源授权已通过区块链网络完成存证，授权信息、审核记录、操作日志均已写入不可篡改的分布式账本。存证哈希可在区块链浏览器中查询验证。
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowEvidence(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-large view-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>查看</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="view-tabs-bar">
              <div className="view-tabs">
                <button type="button" className={'view-tab' + (viewTab === 'apply' ? ' active' : '')} onClick={() => setViewTab('apply')}>申请信息</button>
                <button type="button" className={'view-tab' + (viewTab === 'review' ? ' active' : '')} onClick={() => setViewTab('review')}>审核信息</button>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowEvidence(true)}>查看存证</button>
            </div>
            {viewTab === 'apply' ? renderApplyInfo() : renderReviewInfo()}
          </div>
        </div>
      </div>
      {showEvidence && renderEvidenceModal()}
    </>
  );
};

export default AuthRecordViewModal;

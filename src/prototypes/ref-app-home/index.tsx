/**
 * @name 健身 App 首页
 *
 * 参考资料：
 * - /rules/development-guide.md
 * - /rules/axure-api-guide.md
 * - /docs/设计规范.UIGuidelines.md
 */

import './style.css';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Activity, Flame, Footprints, Timer } from 'lucide-react';

import type {
    Action,
    AxureHandle,
    AxureProps,
    ConfigItem,
    DataDesc,
    EventItem,
    KeyDesc,
} from '../../common/axure-types';

const EVENT_LIST: EventItem[] = [
    { name: 'onCourseClick', desc: '点击课程卡片时触发' },
    { name: 'onStartWorkout', desc: '点击开始训练时触发' },
    { name: 'onTabChange', desc: '切换底部标签栏时触发' },
];

const ACTION_LIST: Action[] = [
    { name: 'refreshData', desc: '刷新首页数据' },
    { name: 'updateProgress', desc: '更新今日目标进度，参数：{ progress: number }' },
    { name: 'switchTab', desc: '切换标签页，参数：{ index: number }' },
];

const VAR_LIST: KeyDesc[] = [
    { name: 'currentTab', desc: '当前选中的标签页索引' },
    { name: 'todayProgress', desc: '今日目标完成进度(0-100)' },
];

const CONFIG_LIST: ConfigItem[] = [
    { type: 'input', attributeId: 'userName', displayName: '用户名', info: '显示的用户名', initialValue: 'Alex' },
    { type: 'colorPicker', attributeId: 'accentColor', displayName: '强调色', info: 'App 的主要强调色', initialValue: '#a6ff00' },
    { type: 'inputNumber', attributeId: 'dailyGoal', displayName: '每日目标(kcal)', info: '每日卡路里消耗目标', initialValue: 500 },
];

const DATA_LIST: DataDesc[] = [
    {
        name: 'courses',
        desc: '推荐课程列表',
        keys: [
            { name: 'id', desc: '课程ID' },
            { name: 'title', desc: '课程标题' },
            { name: 'duration', desc: '时长(分钟)' },
            { name: 'level', desc: '难度等级' },
            { name: 'image', desc: '封面图片URL' },
            { name: 'category', desc: '分类标签' },
        ],
    },
];

function isMobileEditorSafeMode(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return false;
    }

    try {
        const search = new URLSearchParams(window.location.search);
        const editorMode = String(search.get('editor') || '').toLowerCase();
        const hasTouch = ('ontouchstart' in window) || ((navigator.maxTouchPoints || 0) > 0);
        return editorMode.indexOf('webeditor') >= 0 && hasTouch && window.innerWidth <= 768;
    } catch (error) {
        console.warn('检测移动编辑安全模式失败:', error);
        return false;
    }
}

function parseActionParams(params?: string): Record<string, unknown> | null {
    if (!params) {
        return null;
    }

    try {
        return JSON.parse(params) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function getViewportHeight(): string | undefined {
    if (typeof window === 'undefined') {
        return undefined;
    }

    const nextHeight = window.visualViewport?.height || window.innerHeight;
    return nextHeight > 0 ? `${Math.round(nextHeight)}px` : undefined;
}

type TabDefinition = {
    label: string;
    icon: React.ReactNode;
};

const TABS: TabDefinition[] = [
    {
        label: '首页',
        icon: <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
    },
    {
        label: '训练',
        icon: <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6h12"></path><path d="M4 10h16"></path><path d="M6 14h12"></path><path d="M9 18h6"></path></svg>,
    },
    {
        label: '统计',
        icon: <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
    },
    {
        label: '我的',
        icon: <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    },
];

const SUB_PAGE_PATH_BY_TAB: Record<number, string> = {
    0: '',
    1: 'workout',
    2: 'analytics',
    3: 'profile',
};

function getCurrentSubPagePath(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts[0] !== 'prototypes' || pathParts.length < 2) {
        return '';
    }

    return pathParts.slice(2).join('/');
}

function resolveTabIndexFromLocation(): number {
    const subPagePath = getCurrentSubPagePath();
    switch (subPagePath) {
        case 'workout':
            return 1;
        case 'analytics':
            return 2;
        case 'profile':
            return 3;
        default:
            return 0;
    }
}

function syncLocationForTab(index: number) {
    if (typeof window === 'undefined') {
        return;
    }

    const basePathParts = window.location.pathname.split('/').filter(Boolean).slice(0, 2);
    if (basePathParts.length < 2) {
        return;
    }

    const subPagePath = SUB_PAGE_PATH_BY_TAB[index] || '';
    const nextPath = `/${basePathParts.join('/')}${subPagePath ? `/${subPagePath}` : ''}`;
    const nextUrl = `${nextPath}${window.location.search}${window.location.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
        window.history.replaceState(window.history.state, '', nextUrl);
    }
}

function SummaryView({
    accentColor,
    dailyGoal,
    todayProgress,
    userName,
    courses,
    onCourseClick,
    onStartWorkout,
}: {
    accentColor: string;
    dailyGoal: number;
    todayProgress: number;
    userName: string;
    courses: any[];
    onCourseClick: (course: any) => void;
    onStartWorkout: () => void;
}) {
    const radius = 25;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (todayProgress / 100) * circumference;

    return (
        <div className="demo-app-home-scroll-content">
            <div className="demo-app-home-header">
                <h1 className="demo-app-home-greeting">
                    Hi, <span style={{ color: accentColor }}>{userName}</span>
                    <div style={{ fontSize: 14, color: '#888', fontWeight: 'normal', marginTop: 4 }}>
                        今天也要加油哦
                    </div>
                </h1>
                <div className="demo-app-home-avatar">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="avatar" />
                </div>
            </div>

            <div className="demo-app-home-stats">
                <div className="demo-app-home-stat-card">
                    <div className="demo-app-home-stat-icon">
                        <Flame size={20} />
                    </div>
                    <div className="demo-app-home-stat-value">328</div>
                    <div className="demo-app-home-stat-label">千卡消耗</div>
                </div>
                <div className="demo-app-home-stat-card">
                    <div className="demo-app-home-stat-icon">
                        <Timer size={20} />
                    </div>
                    <div className="demo-app-home-stat-value">56</div>
                    <div className="demo-app-home-stat-label">运动分钟</div>
                </div>
                <div className="demo-app-home-stat-card">
                    <div className="demo-app-home-stat-icon">
                        <Footprints size={20} />
                    </div>
                    <div className="demo-app-home-stat-value">3</div>
                    <div className="demo-app-home-stat-label">连续天数</div>
                </div>
            </div>

            <div className="demo-app-home-section">
                <div className="demo-app-home-section-header">
                    <h2 className="demo-app-home-section-title">今日计划</h2>
                    <span className="demo-app-home-section-more">全部计划</span>
                </div>

                <div className="demo-app-home-plan-card">
                    <div className="demo-app-home-plan-progress">
                        <svg>
                            <circle className="demo-app-home-plan-progress-bg" cx="30" cy="30" r={radius} />
                            <circle
                                className="demo-app-home-plan-progress-bar"
                                cx="30"
                                cy="30"
                                r={radius}
                                style={{ strokeDashoffset, stroke: accentColor }}
                            />
                        </svg>
                        <div className="demo-app-home-plan-icon">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div className="demo-app-home-plan-info">
                        <div className="demo-app-home-plan-title">今日定制燃脂冲刺</div>
                        <div className="demo-app-home-plan-subtitle">
                            已完成 {Math.round(dailyGoal * todayProgress / 100)} / {dailyGoal} kcal
                        </div>
                    </div>
                    <button
                        className="demo-app-home-plan-action"
                        style={{ backgroundColor: accentColor }}
                        onClick={onStartWorkout}
                    >
                        ▶
                    </button>
                </div>
            </div>

            <div className="demo-app-home-section">
                <div className="demo-app-home-section-header">
                    <h2 className="demo-app-home-section-title">为你推荐</h2>
                    <span className="demo-app-home-section-more">更多</span>
                </div>

                <div className="demo-app-home-course-list">
                    {courses.map((course: any) => (
                        <div
                            key={course.id}
                            className="demo-app-home-course-card"
                            onClick={() => onCourseClick(course)}
                        >
                            <img src={course.image} className="demo-app-home-course-bg" alt={course.title} />
                            <div className="demo-app-home-course-overlay">
                                <div className="demo-app-home-course-tag" style={{ backgroundColor: accentColor }}>{course.category}</div>
                                <div className="demo-app-home-course-title">{course.title}</div>
                                <div className="demo-app-home-course-meta">
                                    <span>{course.duration} 分钟</span>
                                    <span>•</span>
                                    <span>{course.level}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function AnalyticsView({ accentColor, todayProgress }: { accentColor: string; todayProgress: number }) {
    return (
        <div className="demo-app-home-scroll-content demo-app-home-scroll-content--tab">
            <div className="demo-app-home-section">
                <div className="demo-app-home-section-header">
                    <h2 className="demo-app-home-section-title">本周统计</h2>
                    <span className="demo-app-home-section-more">完整报告</span>
                </div>
                <div style={{
                    display: 'grid',
                    gap: 14,
                    color: '#f5f7fb',
                }}>
                    <div style={{
                        borderRadius: 24,
                        padding: 20,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 8 }}>目标完成率</div>
                        <div style={{ fontSize: 36, fontWeight: 700, color: accentColor }}>{todayProgress}%</div>
                        <div style={{ marginTop: 10, fontSize: 13, color: '#d1d5db' }}>
                            继续保持！本周训练表现出色，建议适度增加心肺和拉伸模块。
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                        {[
                            ['训练完成', '12 次'],
                            ['平均心率', '132 bpm'],
                            ['最佳记录', '28 分钟 HIIT'],
                            ['恢复指数', 'A'],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                style={{
                                    borderRadius: 20,
                                    padding: 16,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}
                            >
                                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{label}</div>
                                <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function WorkoutView({ accentColor }: { accentColor: string }) {
    const plans = [
        { title: '燃脂冲刺', duration: '28 分钟', highlight: '预计消耗 360 kcal' },
        { title: '核心塑形', duration: '18 分钟', highlight: '强化腹背与稳定性' },
        { title: '拉伸恢复', duration: '12 分钟', highlight: '训练后放松与恢复' },
    ];

    return (
        <div className="demo-app-home-scroll-content demo-app-home-scroll-content--tab">
            <div className="demo-app-home-section">
                <div className="demo-app-home-section-header">
                    <h2 className="demo-app-home-section-title">训练计划</h2>
                    <span className="demo-app-home-section-more">今日课程</span>
                </div>
                <div style={{ display: 'grid', gap: 14 }}>
                    {plans.map((plan, index) => (
                        <div
                            key={plan.title}
                            style={{
                                borderRadius: 24,
                                padding: 18,
                                background: index === 0 ? 'rgba(166,255,0,0.12)' : 'rgba(255,255,255,0.05)',
                                border: index === 0 ? `1px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 600 }}>{plan.title}</div>
                                    <div style={{ marginTop: 6, fontSize: 13, color: '#9ca3af' }}>{plan.highlight}</div>
                                </div>
                                <div style={{ fontSize: 13, color: '#d1d5db' }}>{plan.duration}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ProfileView({ accentColor, userName }: { accentColor: string; userName: string }) {
    const profileCards = [
        { label: '会员等级', value: 'Pro 年度会员' },
        { label: '连续训练', value: '6 天' },
        { label: '恢复指数', value: 'A' },
        { label: '设备连接', value: '2 台' },
    ];

    return (
        <div className="demo-app-home-scroll-content demo-app-home-scroll-content--tab">
            <div className="demo-app-home-section">
                <div className="demo-app-home-section-header">
                    <h2 className="demo-app-home-section-title">个人中心</h2>
                    <span className="demo-app-home-section-more">{userName}</span>
                </div>
                <div style={{
                    borderRadius: 24,
                    padding: 20,
                    marginBottom: 14,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 8 }}>账号概览</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: accentColor }}>{userName}</div>
                    <div style={{ marginTop: 8, fontSize: 13, color: '#d1d5db' }}>
                        训练计划、设备连接与恢复状态已同步。
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    {profileCards.map((card) => (
                        <div
                            key={card.label}
                            style={{
                                borderRadius: 20,
                                padding: 16,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{card.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{card.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const Component = forwardRef<AxureHandle, AxureProps>(function FitnessHome(innerProps, ref) {
    const dataSource = innerProps?.data || {};
    const configSource = innerProps?.config || {};
    const onEventHandler = typeof innerProps?.onEvent === 'function' ? innerProps.onEvent : () => undefined;

    const userName = typeof configSource.userName === 'string' && configSource.userName ? configSource.userName : 'Alex';
    const accentColor = typeof configSource.accentColor === 'string' && configSource.accentColor ? configSource.accentColor : '#a6ff00';
    const dailyGoal = typeof configSource.dailyGoal === 'number' ? configSource.dailyGoal : 500;
    const mobileEditorSafeMode = isMobileEditorSafeMode();

    const defaultCourses = [
        { id: 1, title: 'HIIT 高强度燃脂', duration: 20, level: 'K3', category: '减脂', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' },
        { id: 2, title: '腹肌核心撕裂者', duration: 15, level: 'K2', category: '塑形', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' },
        { id: 3, title: '全身拉伸放松', duration: 10, level: 'K1', category: '恢复', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' },
    ];
    const courses = Array.isArray(dataSource.courses) ? dataSource.courses : defaultCourses;

    const [currentTab, setCurrentTab] = useState<number>(() => resolveTabIndexFromLocation());
    const [todayProgress, setTodayProgress] = useState<number>(65);
    const [viewportHeight, setViewportHeight] = useState<string | undefined>(() => getViewportHeight());

    const emitEvent = useCallback((eventName: string, payload?: Record<string, unknown>) => {
        try {
            onEventHandler(eventName, payload ? JSON.stringify(payload) : undefined);
        } catch (error) {
            console.warn('事件触发失败:', error);
        }
    }, [onEventHandler]);

    const handleTabChange = useCallback((index: number) => {
        syncLocationForTab(index);
        setCurrentTab(index);
        emitEvent('onTabChange', { index });
    }, [emitEvent]);

    const handleCourseClick = useCallback((course: any) => {
        emitEvent('onCourseClick', { courseId: course?.id, title: course?.title });
    }, [emitEvent]);

    const handleStartWorkout = useCallback(() => {
        syncLocationForTab(1);
        setCurrentTab(1);
        emitEvent('onStartWorkout', { source: 'summary' });
    }, [emitEvent]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const syncViewportHeight = () => {
            setViewportHeight(getViewportHeight());
        };

        syncViewportHeight();
        window.addEventListener('resize', syncViewportHeight);
        window.addEventListener('orientationchange', syncViewportHeight);
        window.visualViewport?.addEventListener('resize', syncViewportHeight);

        return () => {
            window.removeEventListener('resize', syncViewportHeight);
            window.removeEventListener('orientationchange', syncViewportHeight);
            window.visualViewport?.removeEventListener('resize', syncViewportHeight);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const handleLocationChange = () => {
            setCurrentTab(resolveTabIndexFromLocation());
        };

        handleLocationChange();
        window.addEventListener('popstate', handleLocationChange);

        return () => {
            window.removeEventListener('popstate', handleLocationChange);
        };
    }, []);

    useImperativeHandle(ref, () => ({
        getVar(name: string) {
            const vars: Record<string, unknown> = {
                currentTab,
                todayProgress,
            };
            return vars[name];
        },
        fireAction(name: string, params?: string) {
            const payload = parseActionParams(params);
            switch (name) {
                case 'refreshData':
                    return;
                case 'updateProgress': {
                    const nextProgress = typeof payload?.progress === 'number' ? payload.progress : NaN;
                    if (Number.isFinite(nextProgress)) {
                        setTodayProgress(Math.max(0, Math.min(100, Number(nextProgress))));
                    }
                    return;
                }
                case 'switchTab': {
                    const nextTab = typeof payload?.index === 'number' ? payload.index : NaN;
                    if (Number.isFinite(nextTab) && nextTab >= 0 && nextTab < TABS.length) {
                        syncLocationForTab(Number(nextTab));
                        setCurrentTab(Number(nextTab));
                    }
                    return;
                }
                default:
                    console.warn('未知的动作:', name);
            }
        },
        eventList: EVENT_LIST,
        actionList: ACTION_LIST,
        varList: VAR_LIST,
        configList: CONFIG_LIST,
        dataList: DATA_LIST,
    }), [currentTab, todayProgress]);

    let content: React.ReactNode;
    if (currentTab === 1) {
        content = <WorkoutView accentColor={accentColor} />;
    } else if (currentTab === 2) {
        content = <AnalyticsView accentColor={accentColor} todayProgress={todayProgress} />;
    } else if (currentTab === 3) {
        content = <ProfileView accentColor={accentColor} userName={userName} />;
    } else {
        content = (
            <SummaryView
                accentColor={accentColor}
                dailyGoal={dailyGoal}
                todayProgress={todayProgress}
                userName={userName}
                courses={courses}
                onCourseClick={handleCourseClick}
                onStartWorkout={handleStartWorkout}
            />
        );
    }

    return (
        <div
            className={'demo-app-home-container ' + (mobileEditorSafeMode ? 'demo-app-home-container--editor-mobile-safe' : '')}
            style={{
                '--accent-color': accentColor,
                '--app-home-viewport-height': viewportHeight,
            } as React.CSSProperties}
        >
            {content}

            <div className="demo-app-home-fab" style={{ backgroundColor: accentColor }}>
                +
            </div>

            <div className="demo-app-home-tab-bar">
                {TABS.map((tab, index) => (
                    <div
                        key={tab.label}
                        className={'demo-app-home-tab-item ' + (currentTab === index ? 'active' : '')}
                        style={{ color: currentTab === index ? accentColor : undefined }}
                        onClick={() => handleTabChange(index)}
                    >
                        <div className="demo-app-home-tab-icon">{tab.icon}</div>
                        <div className="demo-app-home-tab-label">{tab.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default Component;

// src/components/common/ValueTooltip.js
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import { efficacyAwareScalingGroupsAtom } from '../../atoms/efficacyMatrix';
import { versionsAtom, zonesAtom } from '../../atoms/matrixFormValues';

const ValueTooltip = ({
                          children,
                          itemId,
                          showMatrix = false,
                          showDetails = true,
                          position = 'top', // 'top', 'bottom', 'left', 'right'
                          width = 320,
                          maxHeight = 400
                      }) => {
    const [versions] = useAtom(versionsAtom);
    const [zones] = useAtom(zonesAtom);
    const [efficacyGroups] = useAtom(efficacyAwareScalingGroupsAtom);
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipContent, setTooltipContent] = useState(null);
    const containerRef = useRef(null);
    const tooltipRef = useRef(null);

    // Find the item in the efficacy groups
    useEffect(() => {
        if (!itemId) {
            setTooltipContent(null);
            return;
        }

        let foundItem = null;
        let foundGroup = null;

        efficacyGroups.forEach(group => {
            group.items.forEach(item => {
                if (item.id === itemId) {
                    foundItem = item;
                    foundGroup = group;
                }
            });
        });

        if (!foundItem) {
            setTooltipContent(null);
            return;
        }

        // Calculate percentage change
        const percentChange = foundItem.baseValue !== 0
            ? ((foundItem.scaledValue - foundItem.baseValue) / Math.abs(foundItem.baseValue)) * 100
            : 0;

        setTooltipContent({
            item: foundItem,
            group: foundGroup,
            percentChange,
        });
    }, [itemId, efficacyGroups]);

    // Format number for display
    const formatNumber = (num) => {
        if (typeof num !== 'number') return 'N/A';

        if (Math.abs(num) >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (Math.abs(num) >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        } else {
            return num.toFixed(2);
        }
    };

    // Position the tooltip based on container position
    const getTooltipPosition = () => {
        if (!containerRef.current || !tooltipRef.current) {
            return { top: 0, left: 0 };
        }

        const containerRect = containerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = -tooltipRect.height - 10;
                left = (containerRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = containerRect.height + 10;
                left = (containerRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = (containerRect.height - tooltipRect.height) / 2;
                left = -tooltipRect.width - 10;
                break;
            case 'right':
                top = (containerRect.height - tooltipRect.height) / 2;
                left = containerRect.width + 10;
                break;
            default:
                top = -tooltipRect.height - 10;
                left = (containerRect.width - tooltipRect.width) / 2;
        }

        // Adjust if tooltip would be off-screen
        const tooltipRight = containerRect.left + left + tooltipRect.width;
        const tooltipBottom = containerRect.top + top + tooltipRect.height;

        if (tooltipRight > windowWidth) {
            left -= tooltipRight - windowWidth + 10;
        }

        if (containerRect.left + left < 0) {
            left = -containerRect.left + 10;
        }

        if (tooltipBottom > windowHeight) {
            top -= tooltipBottom - windowHeight + 10;
        }

        if (containerRect.top + top < 0) {
            top = -containerRect.top + 10;
        }

        return { top, left };
    };

    // Get tooltip size
    const getTooltipSize = () => {
        return {
            width: `${width}px`,
            maxHeight: `${maxHeight}px`,
        };
    };

    return (
        <div
            ref={containerRef}
            className="tooltip-container"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}

            <AnimatePresence>
                {isVisible && tooltipContent && (
                    <motion.div
                        ref={tooltipRef}
                        className={`value-tooltip tooltip-${position}`}
                        style={{
                            ...getTooltipSize(),
                            ...getTooltipPosition(),
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="tooltip-content">
                            <div className="tooltip-header">
                                <h4>{tooltipContent.item.label || tooltipContent.item.id}</h4>
                                <span className={`status-indicator ${tooltipContent.item.isActive ? 'active' : 'inactive'}`}>
                  {tooltipContent.item.isActive ? 'Active' : 'Inactive'}
                </span>
                            </div>

                            {tooltipContent.group && (
                                <div className="tooltip-group">
                                    <span className="group-label">Group:</span>
                                    <span className="group-name">{tooltipContent.group.name}</span>
                                </div>
                            )}

                            {showDetails && (
                                <div className="tooltip-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Base Value:</span>
                                        <span className="detail-value">{formatNumber(tooltipContent.item.baseValue)}</span>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">Scaled Value:</span>
                                        <span className="detail-value">{formatNumber(tooltipContent.item.scaledValue)}</span>
                                    </div>

                                    <div className="detail-row highlight">
                                        <span className="detail-label">Effective Value:</span>
                                        <span className="detail-value highlight">{formatNumber(tooltipContent.item.effectiveValue)}</span>
                                    </div>

                                    <div className="detail-row">
                                        <span className="detail-label">Change:</span>
                                        <span className={`detail-value ${tooltipContent.item.scaledValue > tooltipContent.item.baseValue ? 'positive' : tooltipContent.item.scaledValue < tooltipContent.item.baseValue ? 'negative' : ''}`}>
                      {formatNumber(tooltipContent.item.scaledValue - tooltipContent.item.baseValue)}
                                            {tooltipContent.percentChange !== 0 && (
                                                <span className="percent-change">
                          ({tooltipContent.percentChange > 0 ? '+' : ''}{tooltipContent.percentChange.toFixed(2)}%)
                        </span>
                                            )}
                    </span>
                                    </div>

                                    {tooltipContent.item.efficacyPeriod && (
                                        <div className="detail-row">
                                            <span className="detail-label">Efficacy Period:</span>
                                            <span className="detail-value">
                        Years {tooltipContent.item.efficacyPeriod.start} - {tooltipContent.item.efficacyPeriod.end}
                      </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {showMatrix && (
                                <div className="tooltip-matrix">
                                    <h5>Matrix Values</h5>
                                    <div className="matrix-info">
                                        <div className="matrix-row">
                                            <span className="matrix-label">Version:</span>
                                            <span className="matrix-value">{versions.metadata[versions.active]?.label || versions.active}</span>
                                        </div>

                                        <div className="matrix-row">
                                            <span className="matrix-label">Zone:</span>
                                            <span className="matrix-value">{zones.metadata[zones.active]?.label || zones.active}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ValueTooltip;
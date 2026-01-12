/**
 * Mock: next/image
 * 
 * Simple passthrough mock for Next.js Image component.
 * Renders a standard HTML img element with the provided props.
 * 
 * This avoids issues with:
 * - Image optimization in tests
 * - Missing blur placeholders
 * - Width/height calculation errors
 */

import React from 'react';

const MockImage = ({
    src,
    alt,
    width,
    height,
    fill,
    priority,
    placeholder,
    blurDataURL,
    loader,
    quality,
    sizes,
    style,
    onLoadingComplete,
    onLoad,
    onError,
    loading,
    unoptimized,
    ...props
}) => {
    // Convert fill prop to style
    const imageStyle = fill
        ? { objectFit: 'cover', position: 'absolute', width: '100%', height: '100%', ...style }
        : style;

    return (
        <img
            src={typeof src === 'object' ? src.src : src}
            alt={alt || ''}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            style={imageStyle}
            loading={loading || (priority ? 'eager' : 'lazy')}
            data-testid="next-image"
            {...props}
        />
    );
};

MockImage.displayName = 'MockNextImage';

export default MockImage;




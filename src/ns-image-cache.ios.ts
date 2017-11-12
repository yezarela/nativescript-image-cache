import { NSImageBase, srcProperty, isLoadingProperty } from './ns-image-cache-common';
import { View, Property, booleanConverter } from 'ui/core/view';
import * as application from 'application';
import * as platform from 'platform';
import * as utils from 'utils/utils';
import * as appSettings from 'application-settings';
import * as enums from 'ui/enums';
import * as types from 'utils/types';
import * as fs from 'file-system';
import * as imageSource from 'image-source';

import { layout } from 'utils/utils';

export { srcProperty, isLoadingProperty };
export let isInitialized = false;

export namespace ScaleType {
    export const none = 'none';
    export const aspectFill = 'aspectFill';
    export const aspectFit = 'aspectFit';
    export const fill = 'fill';
}

export const placeholderProperty = new Property<NSImageBase, string>({
    name: 'placeholder',
    defaultValue: undefined,
    valueConverter: v => v,
    affectsLayout: true
});
placeholderProperty.register(NSImageBase);

export const stretchProperty = new Property<NSImageBase, string>({
    name: 'stretch',
    defaultValue: ScaleType.aspectFit,
    affectsLayout: true
});
stretchProperty.register(NSImageBase);

export class NSImage extends NSImageBase {
    public nativeView: UIImageView;
    public placeholder: string;
    private _imageSourceAffectsLayout: boolean = true;

    constructor() {
        super();
        this.nativeView = new UIImageView();
        this.nativeView.contentMode = UIViewContentMode.ScaleAspectFit;
        this.nativeView.clipsToBounds = true;
        this.nativeView.userInteractionEnabled = true;
    }

    [srcProperty.getDefault](): number {
        return undefined;
    }

    [srcProperty.setNative](value: number) {
        if (value) {
            setSource(this, value);
        }
    }

    [placeholderProperty.getDefault](): number {
        return undefined;
    }

    [placeholderProperty.setNative](value: number) {
        if (value) {
        }
    }

    public onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const width = layout.getMeasureSpecSize(widthMeasureSpec);
        const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);

        const height = layout.getMeasureSpecSize(heightMeasureSpec);
        const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);

        const nativeWidth = this.nativeView ? layout.toDevicePixels(this.getMeasuredWidth()) : 0;
        const nativeHeight = this.nativeView ? layout.toDevicePixels(this.getMeasuredHeight()) : 0;

        let measureWidth = Math.max(nativeWidth, this.effectiveMinWidth);
        let measureHeight = Math.max(nativeHeight, this.effectiveMinHeight);

        const finiteWidth: boolean = widthMode !== layout.UNSPECIFIED;
        const finiteHeight: boolean = heightMode !== layout.UNSPECIFIED;

        this._imageSourceAffectsLayout = widthMode !== layout.EXACTLY || heightMode !== layout.EXACTLY;

        if (nativeWidth !== 0 && nativeHeight !== 0 && (finiteWidth || finiteHeight)) {
            const scale = NSImage.computeScaleFactor(
                width,
                height,
                finiteWidth,
                finiteHeight,
                nativeWidth,
                nativeHeight,
                this.stretch
            );
            const resultW = Math.round(nativeWidth * scale.width);
            const resultH = Math.round(nativeHeight * scale.height);

            measureWidth = finiteWidth ? Math.min(resultW, width) : resultW;
            measureHeight = finiteHeight ? Math.min(resultH, height) : resultH;

            const trace = require('trace');
            trace.write(
                'Image stretch: ' + this.stretch + ', nativeWidth: ' + nativeWidth + ', nativeHeight: ' + nativeHeight,
                trace.categories.Layout
            );
        }
        const view = require('ui/core/view');
        const widthAndState = view.View.resolveSizeAndState(measureWidth, width, widthMode, 0);
        const heightAndState = view.View.resolveSizeAndState(measureHeight, height, heightMode, 0);
        this.setMeasuredDimension(widthAndState, heightAndState);
    }

    private static computeScaleFactor(
        measureWidth: number,
        measureHeight: number,
        widthIsFinite: boolean,
        heightIsFinite: boolean,
        nativeWidth: number,
        nativeHeight: number,
        imageStretch: string
    ): { width: number; height: number } {
        let scaleW = 1;
        let scaleH = 1;

        if (
            (imageStretch === ScaleType.aspectFill ||
                imageStretch === ScaleType.aspectFit ||
                imageStretch === ScaleType.fill) &&
            (widthIsFinite || heightIsFinite)
        ) {
            scaleW = nativeWidth > 0 ? measureWidth / nativeWidth : 0;
            scaleH = nativeHeight > 0 ? measureHeight / nativeHeight : 0;

            if (!widthIsFinite) {
                scaleW = scaleH;
            } else if (!heightIsFinite) {
                scaleH = scaleW;
            } else {
                switch (imageStretch) {
                    case ScaleType.aspectFit:
                        scaleH = scaleW < scaleH ? scaleW : scaleH;
                        scaleW = scaleH;
                        break;
                    case ScaleType.aspectFill:
                        scaleH = scaleW > scaleH ? scaleW : scaleH;
                        scaleW = scaleH;
                        break;
                }
            }
        }
        return { width: scaleW, height: scaleH };
    }

    [stretchProperty.getDefault](): string {
        return ScaleType.aspectFit;
    }
    [stretchProperty.setNative](value: string) {
        switch (value) {
            case ScaleType.aspectFit:
                this.nativeView.contentMode = UIViewContentMode.ScaleAspectFit;
                break;
            case ScaleType.aspectFill:
                this.nativeView.contentMode = UIViewContentMode.ScaleAspectFill;
                break;
            case ScaleType.fill:
                this.nativeView.contentMode = UIViewContentMode.ScaleToFill;
                break;
            case ScaleType.none:
            default:
                this.nativeView.contentMode = UIViewContentMode.TopLeft;
                break;
        }
    }
}

const setSource = (image, value) => {
    const placeholder = image.placeholder;
    const placeholderImage = getPlaceholderUIImage(placeholder);

    if (types.isString(value)) {
        value = value.trim();
        if (value.indexOf('http') === 0) {
            image.isLoading = true;
            image['_url'] = value;
            image.ios.sd_setImageWithURLPlaceholderImageCompleted(value, placeholderImage, function() {
                image.isLoading = false;
            });
        } else if (utils.isFileOrResourcePath(value)) {
            image.isLoading = true;
            const source = new imageSource.ImageSource();

            if (value.indexOf(utils.RESOURCE_PREFIX) === 0) {
                const path = value.substr(utils.RESOURCE_PREFIX.length);
                source.fromResource(path).then(function() {
                    image.isLoading = false;
                    image.ios.image = source.ios;
                });
            } else {
                source.fromFile(value).then(function() {
                    image.isLoading = false;
                    image.ios.image = source.ios;
                });
            }
        }
        image.requestLayout();
    }
};

const getPlaceholderUIImage = value => {
    if (types.isString(value)) {
        if (utils.isFileOrResourcePath(value)) {
            return imageSource.fromFileOrResource(value).ios;
        }
    }

    return undefined;
};

export const setCacheLimit = numberOfDays => {
    const noOfSecondsInAMinute = 60;
    const noOfMinutesInAHour = 60;
    const noOfHoursInADay = 24;
    const noOfSecondsADay = noOfSecondsInAMinute * noOfMinutesInAHour * noOfHoursInADay;
    const noOfSecondsInDays = noOfSecondsADay * numberOfDays;
    const currentSeconds = Math.round(new Date().getTime() / 1000);
    let referenceTime = 0;

    if (
        appSettings.getBoolean('isAppOpenedFirstTime') === true ||
        appSettings.getBoolean('isAppOpenedFirstTime') === undefined ||
        appSettings.getBoolean('isAppOpenedFirstTime') === null
    ) {
        appSettings.setBoolean('isAppOpenedFirstTime', false);
        clearCache();
        appSettings.setNumber('cacheTimeReference', currentSeconds);
    } else {
        referenceTime = appSettings.getNumber('cacheTimeReference');
        if (referenceTime === null || referenceTime === undefined) {
            appSettings.setNumber('cacheTimeReference', currentSeconds);
        } else if (currentSeconds - referenceTime > noOfSecondsInDays) {
            clearCache();
            appSettings.setNumber('cacheTimeReference', currentSeconds);
        }
    }
};

export const clearCache = () => {
    const imageCache = SDImageCache.sharedImageCache();
    imageCache.clearMemory();
    if (typeof imageCache.clearDisk == 'undefined') {
        imageCache.deleteOldFilesWithCompletion();
    } else {
        imageCache.clearDisk();
    }
};

export const initializeOnAngular = () => {
    if (isInitialized === false) {
        const _elementRegistry = require('nativescript-angular/element-registry');

        _elementRegistry.registerElement('NSImage', function() {
            return require('nativescript-image-cache').NSImage;
        });
        isInitialized = true;
    }
};

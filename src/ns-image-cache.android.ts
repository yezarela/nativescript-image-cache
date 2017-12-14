import { NSImageBase, srcProperty, isLoadingProperty } from './ns-image-cache-common';
import { View, Property, booleanConverter } from 'ui/core/view';
import * as application from 'application';
import * as platform from 'platform';
import * as utils from 'utils/utils';
import * as appSettings from 'application-settings';
import * as enums from 'ui/enums';
import * as types from 'utils/types';
import * as fs from 'file-system';
import lazy from "utils/lazy";

export { srcProperty, isLoadingProperty };
export let isInitialized = false;

export namespace ScaleType {
    export const none = 'none';
    export const aspectFill = 'aspectFill';
    export const aspectFit = 'aspectFit';
    export const fill = 'fill';
}

export const stretchProperty = new Property<NSImageBase, string>({
    name: 'stretch',
    defaultValue: ScaleType.none,
    valueConverter: v => v,
    affectsLayout: true
});
stretchProperty.register(NSImageBase);

export const radiusProperty = new Property<NSImageBase, number>({
    name: 'radius',
    defaultValue: undefined,
    valueConverter: v => parseFloat(v),
    affectsLayout: true
});
radiusProperty.register(NSImageBase);

export const roundedProperty = new Property<NSImageBase, boolean>({
    name: 'rounded',
    defaultValue: false,
    valueConverter: booleanConverter,
    affectsLayout: true
});
roundedProperty.register(NSImageBase);

export const placeholderProperty = new Property<NSImageBase, string>({
    name: 'placeholder',
    defaultValue: undefined,
    valueConverter: v => v,
    affectsLayout: true
});
placeholderProperty.register(NSImageBase);

export const placeholderStretchProperty = new Property<NSImageBase, string>({
    name: 'placeholderStretch',
    defaultValue: undefined,
    valueConverter: v => v,
    affectsLayout: true
});
placeholderStretchProperty.register(NSImageBase);

let ProxyBaseControllerListener;
function intializeProxyBaseControllerListener(): void {
    if (ProxyBaseControllerListener) {
        return;
    }

    ProxyBaseControllerListener = com.facebook.drawee.controller.BaseControllerListener.extend({
        _MyNSCachedImage: undefined,
        setMyNSCachedImage: function(img) {
            this._MyNSCachedImage = img;
        },
        onFinalImageSet: function(id, imageInfo, anim) {
            if (undefined != this._MyNSCachedImage) {
                this._MyNSCachedImage.isLoading = false;
            }
        },
        onIntermediateImageSet: function(id, imageInfo) {},
        onFailure: function(id, throwable) {
            console.log('onFailure', id, throwable);
        }
    });
}

export class NSImage extends NSImageBase {
    public nativeView: com.facebook.drawee.view.SimpleDraweeView;
    public rounded: boolean;
    public radius: number;
    public placeholder: string;
    public placeholderStretch: string;

    constructor() {
        super();
    }

    [srcProperty.getDefault](): string {
        return undefined;
    }

    [srcProperty.setNative](value: string) {
        if (value) {
            setSource(this, value);
        }
    }

    [stretchProperty.getDefault](): string {
        return ScaleType.none;
    }

    [stretchProperty.setNative](value: string) {
        if (value) {
            this.setStretch(value);
        }
    }

    [radiusProperty.getDefault](): number {
        return undefined;
    }

    [radiusProperty.setNative](value: number) {
        if (value) {
            this.setRadius(value);
        }
    }

    [roundedProperty.getDefault](): boolean {
        return undefined;
    }

    [roundedProperty.setNative](value: boolean) {
        if (value) {
            this.setRounded(value);
        }
    }

    [placeholderProperty.getDefault](): string {
        return undefined;
    }

    [placeholderProperty.setNative](value: string) {
        if (value) {
            this.setPlaceholder(value, this.placeholderStretch);
        }
    }

    [placeholderStretchProperty.getDefault](): string {
        return undefined;
    }

    [placeholderStretchProperty.setNative](value: string) {
        if (value) {
        }
    }

    setRadius(radius) {
        const roundingParams = new com.facebook.drawee.generic.RoundingParams.fromCornersRadius(0);
        roundingParams.setCornersRadius(radius);
        this.nativeView.getHierarchy().setRoundingParams(roundingParams);
    }

    setRounded(rounded) {
        const roundingParams = new com.facebook.drawee.generic.RoundingParams.fromCornersRadius(0);
        if (rounded) {
            roundingParams.setRoundAsCircle(true);
        } else {
            roundingParams.setRoundAsCircle(false);
        }
        this.nativeView.getHierarchy().setRoundingParams(roundingParams);
    }

    setPlaceholder(src: string, stretch: string) {
        const drawable = getPlaceholderImageDrawable(src);
        const scaleType = getScaleType(stretch) || getScaleType(ScaleType.none);

        if (drawable === null) {
            return;
        }

        this.nativeView.getHierarchy().setPlaceholderImage(drawable, scaleType);
    }

    setStretch(stretch: string) {
        const scaleType = getScaleType(stretch) || getScaleType(ScaleType.none);
        this.nativeView.getHierarchy().setActualImageScaleType(scaleType);
    }

    createNativeView() {
        this.nativeView = new com.facebook.drawee.view.SimpleDraweeView(this._context);
        if (this.src !== undefined) {
            setSource(this, this.src);
        }
        if (this.stretch !== undefined) {
            this.setStretch(this.stretch);
        }
        if (this.rounded !== undefined) {
            this.setRounded(this.rounded);
        }
        if (this.radius !== undefined) {
            this.setRadius(this.radius);
        }
        if (this.placeholder !== undefined) {
            this.setPlaceholder(this.placeholder, this.placeholderStretch);
        }
        return this.nativeView;
    }
}

const setSource = (image, value) => {
    if (types.isString(value)) {
        value = value.trim();
        if (utils.isFileOrResourcePath(value) || value.indexOf('http') === 0) {
            image.isLoading = true;
            let fileName = '';
            if (value.indexOf('~/') === 0) {
                fileName = fs.path.join(fs.knownFolders.currentApp().path, value.replace('~/', ''));
                fileName = 'file:' + fileName;
            } else if (value.indexOf('/') === 0) {
                fileName = 'file:' + value;
            } else if (value.indexOf('res') === 0) {
                fileName = value;
                const res = utils.ad.getApplicationContext().getResources();
                const resName = fileName.substr(utils.RESOURCE_PREFIX.length);
                const identifier = res.getIdentifier(resName, 'drawable', utils.ad.getApplication().getPackageName());
                fileName = 'res:/' + identifier;
            } else if (value.indexOf('http') === 0) {
                image.isLoading = true;
                fileName = value;
            }

            let request;
            const startRequest = com.facebook.imagepipeline.request.ImageRequestBuilder.newBuilderWithSource(
                android.net.Uri.parse(fileName)
            );

            if (fileName.indexOf('.png') < 0) {
                request = startRequest.setProgressiveRenderingEnabled(true).build();
            } else {
                request = startRequest.build();
            }

            intializeProxyBaseControllerListener();
            const controllerListener = new ProxyBaseControllerListener();
            controllerListener.setMyNSCachedImage(image);

            const controller = com.facebook.drawee.backends.pipeline.Fresco
                .newDraweeControllerBuilder()
                .setImageRequest(request)
                .setControllerListener(controllerListener)
                .setOldController(image.android.getController())
                .setTapToRetryEnabled(true)
                .build();

            image.android.setController(controller);
            image.requestLayout();
        } else {
            throw new Error('Path "' + '" is not a valid file or resource.');
        }
    }
};

const getScaleType = (scaleType: string) => {
    if (types.isString(scaleType)) {
        switch (scaleType) {
            case ScaleType.none:
                return com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER;
            case ScaleType.aspectFill:
                return com.facebook.drawee.drawable.ScalingUtils.ScaleType.CENTER_CROP;
            case ScaleType.aspectFit:
                return com.facebook.drawee.drawable.ScalingUtils.ScaleType.FIT_CENTER;
            case ScaleType.fill:
                return com.facebook.drawee.drawable.ScalingUtils.ScaleType.FIT_XY;
            default:
                break;
        }
    }
};

const getPlaceholderImageDrawable = value => {
    let fileName = '';
    let drawable = null;

    if (types.isString(value)) {
        value = value.trim();

        if (utils.isFileOrResourcePath(value)) {
            if (value.indexOf('~/') === 0) {
                fileName = fs.path.join(fs.knownFolders.currentApp().path, value.replace('~/', ''));
                drawable = android.graphics.drawable.Drawable.createFromPath(fileName);
            } else if (value.indexOf('/') === 0) {
                fileName = 'file:' + value;
                drawable = android.graphics.drawable.Drawable.createFromPath(fileName);
            } else if (value.indexOf('res') === 0) {
                fileName = value;
                const res = utils.ad.getApplicationContext().getResources();
                const resName = fileName.substr(utils.RESOURCE_PREFIX.length);
                const identifier = res.getIdentifier(resName, 'drawable', utils.ad.getApplication().getPackageName());
                drawable = res.getDrawable(identifier);
            }
        }
    }

    return drawable;
};

export const setCacheLimit = numberOfDays => {
    const noOfSecondsInAMinute = 60,
        noOfMinutesInAHour = 60,
        noOfHoursInADay = 24,
        noOfSecondsADay = noOfSecondsInAMinute * noOfMinutesInAHour * noOfHoursInADay,
        noOfSecondsInDays = noOfSecondsADay * numberOfDays,
        currentSeconds = Math.round(new Date().getTime() / 1000);
    let referenceTime = 0;

    if (
        appSettings.getBoolean('isAppOpenedFirstTime') === true ||
        appSettings.getBoolean('isAppOpenedFirstTime') === undefined ||
        appSettings.getBoolean('isAppOpenedFirstTime') === null
    ) {
        appSettings.setBoolean('isAppOpenedFirstTime', false);
        com.facebook.drawee.backends.pipeline.Fresco.getImagePipeline().clearCaches();
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

export const initialize = () => {
    com.facebook.drawee.backends.pipeline.Fresco.initialize(application.android.context);
};

export const clearCache = () => {
    com.facebook.drawee.backends.pipeline.Fresco.getImagePipeline().clearCaches();
};

export const initializeOnAngular = () => {
    if (isInitialized === false) {
        const _elementRegistry = require('nativescript-angular/element-registry');

        _elementRegistry.registerElement('NSImage', function() {
            return require('nativescript-image-cache').NSImage;
        });
        initialize();
        isInitialized = true;
    }
};

import { NSImageCacheBase, srcProperty, isLoadingProperty } from "./ns-image-cache-common";
import { View, Property, booleanConverter } from "ui/core/view";
import * as application from "application";
import * as platform from "platform";
import * as utils from "utils/utils"
import * as appSettings from "application-settings"
import * as enums from "ui/enums"
import * as types from "utils/types"
import * as fs from "file-system"


export { srcProperty, isLoadingProperty };
export let isInitialized = false


export module ScaleType {
    export var none = "none";
    export var aspectFill = "aspectFill";
    export var aspectFit = "aspectFit";
    export var fill = "fill";
}


export const stretchProperty = new Property<NSImageCacheBase, string>({
    name: "stretch",
    defaultValue: ScaleType.none,
    valueConverter: (v) => v,
    affectsLayout: true
});
stretchProperty.register(NSImageCacheBase)


export const radiusProperty = new Property<NSImageCacheBase, number>({
    name: "radius",
    defaultValue: undefined,
    valueConverter: (v) => parseFloat(v),
    affectsLayout: true
});
radiusProperty.register(NSImageCacheBase)


export const roundedProperty = new Property<NSImageCacheBase, boolean>({
    name: "rounded",
    defaultValue: false,
    valueConverter: booleanConverter,
    affectsLayout: true
});
roundedProperty.register(NSImageCacheBase)


export const placeholderProperty = new Property<NSImageCacheBase, string>({
    name: "placeholder",
    defaultValue: undefined,
    valueConverter: (v) => v,
    affectsLayout: true
});
placeholderProperty.register(NSImageCacheBase)


export const placeholderStretchProperty = new Property<NSImageCacheBase, string>({
    name: "placeholderStretch",
    defaultValue: undefined,
    valueConverter: (v) => v,
    affectsLayout: true
});
placeholderStretchProperty.register(NSImageCacheBase)


const ProxyBaseControllerListener = com.facebook.drawee.controller.BaseControllerListener.extend({
    _MyNSCachedImage: undefined,
    setMyNSCachedImage: function (img) {
        this._MyNSCachedImage = img;
    },
    onFinalImageSet: function (id, imageInfo, anim) {
        if (undefined != this._MyNSCachedImage) {
            this._MyNSCachedImage.isLoading = false;
        }
    },
    onIntermediateImageSet: function (id, imageInfo) { },
    onFailure: function (id, throwable) { }
});


export class NSImageCache extends NSImageCacheBase {

    public nativeView: com.facebook.drawee.view.SimpleDraweeView;
    public rounded: boolean;
    public radius: number;
    public placeholder: string;
    public placeholderStretch: string;

    constructor() {
        super();
    }

    [srcProperty.getDefault](): number {
        return undefined;
    }

    [srcProperty.setNative](value: number) {
        if (value) {
            setSource(this, value)
        }
    }

    [stretchProperty.getDefault](): string {
        return ScaleType.none;
    }

    [stretchProperty.setNative](value: string) {
        if (value) {
            this.setNativeStretch(value)
        }
    }

    [radiusProperty.getDefault](): number {
        return undefined;
    }

    [radiusProperty.setNative](value: number) {
        if (value) {
            this.setRadius(value)
        }
    }

    [roundedProperty.getDefault](): number {
        return undefined;
    }

    [roundedProperty.setNative](value: number) {
        if (value) {
            this.setRounded(value)
        }
    }

    [placeholderProperty.getDefault](): number {
        return undefined;
    }

    [placeholderProperty.setNative](value: number) {
        if (value) {
            this.setPlaceholder(value, this.placeholderStretch)
        }
    }

    [placeholderStretchProperty.getDefault](): number {
        return undefined;
    }

    [placeholderStretchProperty.setNative](value: number) {
        if (value) { }
    }


    setRadius(radius) {
        var roundingParams = new com.facebook.drawee.generic.RoundingParams.fromCornersRadius(0);
        roundingParams.setCornersRadius(radius);
        this.nativeView.getHierarchy().setRoundingParams(roundingParams);
    }


    setRounded(rounded) {
        var roundingParams = new com.facebook.drawee.generic.RoundingParams.fromCornersRadius(0);
        if (rounded)
            roundingParams.setRoundAsCircle(true);
        else
            roundingParams.setRoundAsCircle(false);
        this.nativeView.getHierarchy().setRoundingParams(roundingParams);
    }


    setPlaceholder(src, placeholderStretch) {
        var drawable = getPlaceholderImageDrawable(src),
            nativePlaceholderStretch = getScaleType[placeholderStretch] || getScaleType(ScaleType.none)

        if (null == drawable) {
            return;
        }

        this.nativeView.getHierarchy().setPlaceholderImage(drawable, nativePlaceholderStretch);
    }



    setNativeStretch(stretch: string) {
        var frescoStretch = getScaleType(stretch) || getScaleType(ScaleType.none)
        this.nativeView.getHierarchy().setActualImageScaleType(frescoStretch);
    }


    public createNativeView() {
        this.nativeView = new com.facebook.drawee.view.SimpleDraweeView(this._context);
        if (undefined !== this.src) {
            setSource(this, this.src);
        }
        if (undefined !== this.stretch) {
            this.setNativeStretch(this.stretch);
        }
        if (undefined !== this.rounded) {
            this.setRounded(this.rounded);
        }
        if (undefined !== this.radius) {
            this.setRadius(this.radius);
        }
        if (undefined !== this.placeholder) {
            this.setPlaceholder(this.placeholder, this.placeholderStretch);
        }
        return this.nativeView;
    }

}


function setSource(image, value) {
    image.android.setImageURI(null, null);

    if (types.isString(value)) {
        value = value.trim();
        if (utils.isFileOrResourcePath(value) || 0 === value.indexOf("http")) {
            image.isLoading = true;
            var fileName = "";
            if (0 === value.indexOf("~/")) {
                fileName = fs.path.join(fs.knownFolders.currentApp().path, value.replace("~/", ""));
                fileName = "file:" + fileName;
            } else if (0 == value.indexOf("res")) {
                fileName = value;
                var res = utils.ad.getApplicationContext().getResources();
                var resName = fileName.substr(utils.RESOURCE_PREFIX.length);
                var identifier = res.getIdentifier(resName, 'drawable', utils.ad.getApplication().getPackageName());
                fileName = "res:/" + identifier;
            } else if (0 === value.indexOf("http")) {
                image.isLoading = true;
                fileName = value;
            }

            image.android.setImageURI(android.net.Uri.parse(fileName), null);

            var controllerListener = new ProxyBaseControllerListener();
            controllerListener.setMyNSCachedImage(image);


            var controller = com.facebook.drawee.backends.pipeline.Fresco.newDraweeControllerBuilder()
                .setControllerListener(controllerListener)
                .setUri(android.net.Uri.parse(fileName))
                .build();
            image.android.setController(controller);

            image.requestLayout();

        } else {
            throw new Error("Path \"" + "\" is not a valid file or resource.");
        }
    }

}


function getScaleType(scaleType: string) {
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
}


function getPlaceholderImageDrawable(value) {

    var fileName = "",
        drawable = null;


    if (types.isString(value)) {

        value = value.trim();

        if (utils.isFileOrResourcePath(value)) {


            if (0 === value.indexOf("~/")) {
                fileName = fs.path.join(fs.knownFolders.currentApp().path, value.replace("~/", ""));
                drawable = android.graphics.drawable.Drawable.createFromPath(fileName);
            } else if (0 == value.indexOf("res")) {
                fileName = value;
                var res = utils.ad.getApplicationContext().getResources();
                var resName = fileName.substr(utils.RESOURCE_PREFIX.length);
                var identifier = res.getIdentifier(resName, 'drawable', utils.ad.getApplication().getPackageName());
                drawable = res.getDrawable(identifier);
            }


        }
    }

    return drawable;

}


export function setCacheLimit(numberOfDays) {

    var noOfSecondsInAMinute = 60,
        noOfMinutesInAHour = 60,
        noOfHoursInADay = 24,
        noOfSecondsADay = noOfSecondsInAMinute * noOfMinutesInAHour * noOfHoursInADay,
        noOfSecondsInDays = noOfSecondsADay * numberOfDays,
        currentSeconds = Math.round(new Date().getTime() / 1000),
        referenceTime = 0;


    if (true == appSettings.getBoolean("isAppOpenedFirstTime") || undefined == appSettings.getBoolean("isAppOpenedFirstTime") || null == appSettings.getBoolean("isAppOpenedFirstTime")) {
        appSettings.setBoolean("isAppOpenedFirstTime", false);
        com.facebook.drawee.backends.pipeline.Fresco.getImagePipeline().clearCaches();
        appSettings.setNumber("cacheTimeReference", currentSeconds);
    } else {
        referenceTime = appSettings.getNumber("cacheTimeReference");
        if (null == referenceTime || undefined == referenceTime) {
            appSettings.setNumber("cacheTimeReference", currentSeconds);
        } else if ((currentSeconds - referenceTime) > noOfSecondsInDays) {
            clearCache();
            appSettings.setNumber("cacheTimeReference", currentSeconds);
        }
    }
}



export function initialize() {
    com.facebook.drawee.backends.pipeline.Fresco.initialize(application.android.context);
}


export function clearCache() {
    com.facebook.drawee.backends.pipeline.Fresco.getImagePipeline().clearCaches();
}


export function initializeOnAngular() {
    if (false === isInitialized) {
        var _elementRegistry = require("nativescript-angular/element-registry");

        _elementRegistry.registerElement("WebImage", function () {
            return require("nativescript-web-image-cache").WebImage;
        });
        initialize();
        isInitialized = true;
    }
}
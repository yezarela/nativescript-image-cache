import { NSImageBase, srcProperty, isLoadingProperty } from "./ns-image-cache-common";
import { View, Property, booleanConverter } from "ui/core/view";
import * as application from "application";
import * as platform from "platform";
import * as utils from "utils/utils"
import * as appSettings from "application-settings"
import * as enums from "ui/enums"
import * as types from "utils/types"
import * as fs from "file-system"
import * as imageSource from "image-source"


export { srcProperty, isLoadingProperty };
export let isInitialized = false


export module ScaleType {
    export var none = "none";
    export var aspectFill = "aspectFill";
    export var aspectFit = "aspectFit";
    export var fill = "fill";
}


export const stretchProperty = new Property<NSImageBase, string>({
    name: "stretch",
    defaultValue: ScaleType.none,
    valueConverter: (v) => v,
    affectsLayout: true
});
stretchProperty.register(NSImageBase)


export const placeholderProperty = new Property<NSImageBase, string>({
    name: "placeholder",
    defaultValue: undefined,
    valueConverter: (v) => v,
    affectsLayout: true
});
placeholderProperty.register(NSImageBase)


export class NSImage extends NSImageBase {

    public nativeView: UIImageView;
    public placeholder: string;

    constructor() {
        super();
        this.nativeView = new UIImageView();
        this.nativeView.contentMode = UIViewContentMode.UIViewContentModeScaleAspectFit;
        this.nativeView.clipsToBounds = true;
        this.nativeView.userInteractionEnabled = true;
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
        if (value) { }
    }

    [placeholderProperty.getDefault](): number {
        return undefined;
    }

    [placeholderProperty.setNative](value: number) {
        if (value) { }
    }


    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        var utils = require("utils/utils");
        var width = utils.layout.getMeasureSpecSize(widthMeasureSpec);
        var widthMode = utils.layout.getMeasureSpecMode(widthMeasureSpec);
        var height = utils.layout.getMeasureSpecSize(heightMeasureSpec);
        var heightMode = utils.layout.getMeasureSpecMode(heightMeasureSpec);
        var nativeWidth = this.nativeView ? (this.nativeView.image ? this.nativeView.image.size.width : 0) : 0;
        var nativeHeight = this.nativeView ? (this.nativeView.image ? this.nativeView.image.size.height : 0) : 0;
        var measureWidth = Math.max(nativeWidth, this.minWidth);
        var measureHeight = Math.max(nativeHeight, this.minHeight);
        var finiteWidth = widthMode !== utils.layout.UNSPECIFIED;
        var finiteHeight = heightMode !== utils.layout.UNSPECIFIED;
        if (nativeWidth !== 0 && nativeHeight !== 0 && (finiteWidth || finiteHeight)) {
            var scale = this.computeScaleFactor(width, height, finiteWidth, finiteHeight, nativeWidth, nativeHeight, this.stretch);
            var resultW = Math.floor(nativeWidth * scale.width);
            var resultH = Math.floor(nativeHeight * scale.height);
            measureWidth = finiteWidth ? Math.min(resultW, width) : resultW;
            measureHeight = finiteHeight ? Math.min(resultH, height) : resultH;
            var trace = require("trace");
            trace.write("Image stretch: " + this.stretch +
                ", nativeWidth: " + nativeWidth +
                ", nativeHeight: " + nativeHeight, trace.categories.Layout);
        }
        var view = require("ui/core/view");
        var widthAndState = view.View.resolveSizeAndState(measureWidth, width, widthMode, 0);
        var heightAndState = view.View.resolveSizeAndState(measureHeight, height, heightMode, 0);
        this.setMeasuredDimension(widthAndState, heightAndState);
    }


    computeScaleFactor(measureWidth, measureHeight, widthIsFinite, heightIsFinite, nativeWidth, nativeHeight, imageStretch) {
        var scaleW = 1;
        var scaleH = 1;
        if ((imageStretch === enums.Stretch.aspectFill || imageStretch === enums.Stretch.aspectFit || imageStretch === enums.Stretch.fill) &&
            (widthIsFinite || heightIsFinite)) {
            scaleW = (nativeWidth > 0) ? measureWidth / nativeWidth : 0;
            scaleH = (nativeHeight > 0) ? measureHeight / nativeHeight : 0;
            if (!widthIsFinite) {
                scaleW = scaleH;
            }
            else if (!heightIsFinite) {
                scaleH = scaleW;
            }
            else {
                switch (imageStretch) {
                    case enums.Stretch.aspectFit:
                        scaleH = scaleW < scaleH ? scaleW : scaleH;
                        scaleW = scaleH;
                        break;
                    case enums.Stretch.aspectFill:
                        scaleH = scaleW > scaleH ? scaleW : scaleH;
                        scaleW = scaleH;
                        break;
                }
            }
        }
        return { width: scaleW, height: scaleH };
    }


}



function setSource(image, value) {

    var placeholder = image.placeholder,
        placeholderImage = getPlaceholderUIImage(placeholder);

    if (types.isString(value)) {
        value = value.trim();
        if (0 === value.indexOf("http")) {
            image.isLoading = true;
            image["_url"] = value;
            image.ios.sd_setImageWithURLPlaceholderImageCompleted(value, placeholderImage, function () {
                image.isLoading = false;

            });
        } else if (utils.isFileOrResourcePath(value)) {
            image.isLoading = true;
            var source = new imageSource.ImageSource();

            if (0 === value.indexOf(utils.RESOURCE_PREFIX)) {
                var path = value.substr(utils.RESOURCE_PREFIX.length);
                source.fromResource(path).then(function () {
                    image.isLoading = false;
                    image.ios.image = source.ios;
                });
            } else {
                source.fromFile(value).then(function () {
                    image.isLoading = false;
                    image.ios.image = source.ios;
                });
            }

        }
        image.requestLayout();
    }

}


function getScaleType(scaleType: string) {
    if (types.isString(scaleType)) {
        switch (scaleType) {
            case ScaleType.none:
                return UIViewContentMode.UIViewContentModeTopLeft;
            case ScaleType.aspectFill:
                return UIViewContentMode.UIViewContentModeScaleAspectFill;
            case ScaleType.aspectFit:
                return UIViewContentMode.UIViewContentModeScaleAspectFit;
            case ScaleType.fill:
                return UIViewContentMode.UIViewContentModeScaleToFill;
            default:
                break;
        }
    }
}


function getPlaceholderUIImage(value) {
    if (types.isString(value)) {
        if (utils.isFileOrResourcePath(value)) {
            return imageSource.fromFileOrResource(value).ios;
        }
    }

    return undefined;
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
        clearCache();
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


export function clearCache() {
    var imageCache = SDImageCache.sharedImageCache();
    imageCache.clearMemory();
    imageCache.clearDisk();
}


export function initializeOnAngular() {
    if (false === isInitialized) {
        var _elementRegistry = require("nativescript-angular/element-registry");

        _elementRegistry.registerElement("NSImage", function () {
            return require("nativescript-image-cache").NSImage;
        });
        isInitialized = true;
    }
};



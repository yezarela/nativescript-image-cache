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

import { layout } from "utils/utils";

export { srcProperty, isLoadingProperty };
export let isInitialized = false

export const placeholderProperty = new Property<NSImageBase, string>({
    name: "placeholder",
    defaultValue: undefined,
    valueConverter: (v) => v,
    affectsLayout: true
});
placeholderProperty.register(NSImageBase)

export const stretchProperty = new Property<NSImageBase, string>({
    name: "stretch",
    defaultValue: "aspectFit",
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
            setSource(this, value)
        }
    }

    [placeholderProperty.getDefault](): number {
        return undefined;
    }

    [placeholderProperty.setNative](value: number) {
        if (value) { }
    }

    public onMeasure(widthMeasureSpec, heightMeasureSpec) {

        let width = layout.getMeasureSpecSize(widthMeasureSpec);
        let widthMode = layout.getMeasureSpecMode(widthMeasureSpec);

        let height = layout.getMeasureSpecSize(heightMeasureSpec);
        let heightMode = layout.getMeasureSpecMode(heightMeasureSpec);

        let nativeWidth = this.nativeView ? layout.toDevicePixels(this.getMeasuredWidth()) : 0;
        let nativeHeight = this.nativeView ? layout.toDevicePixels(this.getMeasuredHeight()) : 0;

        let measureWidth = Math.max(nativeWidth, this.effectiveMinWidth);
        let measureHeight = Math.max(nativeHeight, this.effectiveMinHeight);

        let finiteWidth: boolean = widthMode !== layout.UNSPECIFIED;
        let finiteHeight: boolean = heightMode !== layout.UNSPECIFIED;

        this._imageSourceAffectsLayout = widthMode !== layout.EXACTLY || heightMode !== layout.EXACTLY;


        if (nativeWidth !== 0 && nativeHeight !== 0 && (finiteWidth || finiteHeight)) {
            let scale = NSImage.computeScaleFactor(width, height, finiteWidth, finiteHeight, nativeWidth, nativeHeight, this.stretch);
            let resultW = Math.round(nativeWidth * scale.width);
            let resultH = Math.round(nativeHeight * scale.height);

            measureWidth = finiteWidth ? Math.min(resultW, width) : resultW;
            measureHeight = finiteHeight ? Math.min(resultH, height) : resultH;

            var trace = require("trace");
            trace.write("Image stretch: " + this.stretch +
                ", nativeWidth: " + nativeWidth +
                ", nativeHeight: " + nativeHeight, trace.categories.Layout);
        }
        var view = require("ui/core/view");
        let widthAndState = view.View.resolveSizeAndState(measureWidth, width, widthMode, 0);
        let heightAndState = view.View.resolveSizeAndState(measureHeight, height, heightMode, 0);
        this.setMeasuredDimension(widthAndState, heightAndState);
    }


    private static computeScaleFactor(measureWidth: number, measureHeight: number, widthIsFinite: boolean, heightIsFinite: boolean, nativeWidth: number, nativeHeight: number, imageStretch: string): { width: number; height: number } {
        let scaleW = 1;
        let scaleH = 1;

        if ((imageStretch === "aspectFill" || imageStretch === "aspectFit" || imageStretch === "fill") &&
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
                    case "aspectFit":
                        scaleH = scaleW < scaleH ? scaleW : scaleH;
                        scaleW = scaleH;
                        break;
                    case "aspectFill":
                        scaleH = scaleW > scaleH ? scaleW : scaleH;
                        scaleW = scaleH;
                        break;
                }
            }
        }
        return { width: scaleW, height: scaleH };
    }

    [stretchProperty.getDefault](): "aspectFit" {
        return "aspectFit";
    }
    [stretchProperty.setNative](value: "none" | "aspectFill" | "aspectFit" | "fill") {
        switch (value) {
            case "aspectFit":
                this.nativeView.contentMode = UIViewContentMode.ScaleAspectFit;
                break;
            case "aspectFill":
                this.nativeView.contentMode = UIViewContentMode.ScaleAspectFill;
                break;
            case "fill":
                this.nativeView.contentMode = UIViewContentMode.ScaleToFill;
                break;
            case "none":
            default:
                this.nativeView.contentMode = UIViewContentMode.TopLeft;
                break;
        }
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
    if ( typeof (imageCache.clearDisk) == 'undefined') {
        imageCache.deleteOldFilesWithCompletion();        
    } else {
        imageCache.clearDisk();
    }
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



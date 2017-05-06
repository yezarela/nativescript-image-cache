import { View, Property, booleanConverter } from "ui/core/view";
import { NSImageCache } from "./ns-image-cache";

export { NSImageCache };
export class NSImageCacheBase extends View implements NSImageCache {

    src: string;
    isLoading: boolean;
    stretch: string;

    public get android(): any {
        return this.nativeView;
    }

    public set android(value) {
        this.nativeView = value;
    }

    public get ios(): any {
        return this.nativeView;
    }

    public set ios(value) {
        this.nativeView = value;
    }

}

export const srcProperty = new Property<NSImageCacheBase, string>({
    name: "src",
    defaultValue: undefined,
});
srcProperty.register(NSImageCacheBase);

export const isLoadingProperty = new Property<NSImageCacheBase, boolean>({
    name: "isLoading",
    defaultValue: true,
    valueConverter: booleanConverter
});
isLoadingProperty.register(NSImageCacheBase);
import { View, Property, booleanConverter } from 'ui/core/view';
import { NSImage } from './ns-image-cache';

export { NSImage };
export class NSImageBase extends View implements NSImage {
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

export const srcProperty = new Property<NSImageBase, string>({
    name: 'src',
    defaultValue: undefined
});
srcProperty.register(NSImageBase);

export const isLoadingProperty = new Property<NSImageBase, boolean>({
    name: 'isLoading',
    defaultValue: true,
    valueConverter: booleanConverter
});
isLoadingProperty.register(NSImageBase);

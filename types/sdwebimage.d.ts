declare class UIImageView {
    contentMode: UIViewContentMode
    clipsToBounds: boolean
    userInteractionEnabled: boolean
    image: any
}

declare enum UIViewContentMode {
    UIViewContentModeScaleAspectFit,
    UIViewContentModeScaleAspectFill,
    UIViewContentModeScaleToFill,
    UIViewContentModeTopLeft,
}

declare class SDImageCache {
    static sharedImageCache
}

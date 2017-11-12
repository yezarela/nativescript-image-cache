declare class UIImageView {
    contentMode: UIViewContentMode
    clipsToBounds: boolean
    userInteractionEnabled: boolean
    image: any
}

declare enum UIViewContentMode {
    ScaleAspectFit,
    ScaleAspectFill,
    ScaleToFill,
    TopLeft,
}

declare class SDImageCache {
    static sharedImageCache
}

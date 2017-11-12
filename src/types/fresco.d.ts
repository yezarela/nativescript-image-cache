declare module com {
    module facebook {
        module drawee {
            module drawable {
                class ProgressBarDrawable<T> {
                    constructor();
                    setColor(color: any);
                }

                module ScalingUtils {
                    class ScaleType {
                        static CENTER;
                        static CENTER_CROP;
                        static CENTER_INSIDE;
                        static FIT_CENTER;
                        static FIT_END;
                        static FIT_START;
                        static FIT_XY;
                        static FOCUS_CROP;
                    }
                }
            }

            module backends {
                module pipeline {
                    class Fresco {
                        static initialize(context);

                        static newDraweeControllerBuilder(): PipelineDraweeControllerBuilder;

                        static getImagePipeline(): com.facebook.imagepipeline.core.ImagePipeline;
                    }
                }

                class PipelineDraweeController {

                }

                class PipelineDraweeControllerBuilder {
                    setAutoPlayAnimations(value: boolean): PipelineDraweeControllerBuilder;
                    setImageRequest(uri): PipelineDraweeControllerBuilder;
                    setControllerListener(controller: com.facebook.drawee.controller.ControllerListener<com.facebook.imagepipeline.image.ImageInfo>): PipelineDraweeControllerBuilder;
                    setTapToRetryEnabled(value: boolean): PipelineDraweeControllerBuilder;
                    setOldController(controller): PipelineDraweeControllerBuilder;
                    setUri(uri): PipelineDraweeControllerBuilder;
                    build(): PipelineDraweeController;
                }
            }

            module view {
                class SimpleDraweeView {
                    constructor(context);
                    setImageURI(context, hierarchy);
                    setImageURI(context);
                    getController();
                    setController(controller);
                    setHierarchy(hierarchy);
                    setAspectRatio(ratio: number);
                    getHierarchy();
                }
            }

            module controller {
                class ControllerListener<T> {
                    constructor(context);
                }
                class BaseControllerListener {
                    static extend(args)
                }
            }

            module generic {
                class GenericDraweeHierarchyBuilder {
                    constructor(context);
                    setPlaceholderImage(drawable);
                    setFailureImage(drawable);
                    setActualImageScaleType(sclaleType);
                    build();
                    setFadeDuration(duration: number);
                    setBackground(drawable);
                    setProgressBarImage(drawable);
                    setRoundingParams(params: RoundingParams);
                    shutDown();
                }

                class GenericDraweeHierarchy {

                }

                class RoundingParams {
                    static asCircle(): void;
                    static fromCornersRadius(value: number): void;
                    setCornersRadius(topLeft: number, topRight: number, bottomRight: number, bottomLeft: number);
                }
            }
        }

        module common {
            module util {
                class UriUtil {
                    static LOCAL_RESOURCE_SCHEME;
                }
            }
        }

        module imagepipeline {
            module request {
                class ImageRequestBuilder {
                    static newBuilderWithSource(url);
                }
            }

            module image {
                class ImageInfo {
                    getHeight(): number;
                    getWidth(): number;
                    getQualityInfo(): QualityInfo;
                }

                class QualityInfo {
                    getQuality(): number;
                    isOfFullQuality(): boolean;
                    isOfGoodEnoughQuality(): boolean;
                }

                class ImmutableQualityInfo {
                    getQuality(): number;
                    isOfFullQuality(): boolean;
                    isOfGoodEnoughQuality(): boolean;
                }
            }

            module animated {
                module base {
                    class AnimatedDrawable {
                        start(): void;
                        stop(): void;
                        isRunning(): boolean;
                    }
                }
            }

            module core {
                class ImagePipeline {
                    isInBitmapMemoryCache(uri: string): boolean;
                    isInDiskCacheSync(uri: string): boolean;
                    evictFromMemoryCache(uri: string): void;
                    evictFromDiskCache(uri: string): void;
                    evictFromCache(uri: string): void;
                    clearCaches(): void;
                    clearMemoryCaches(): void;
                    clearDiskCaches(): void;
                }
            }
        }
    }
}


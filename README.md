# Nativescript Image Cache

[![npm version](https://badge.fury.io/js/nativescript-image-cache.svg)](https://badge.fury.io/js/nativescript-image-cache)

Nativescript image caching plugin using Fresco for Android and SDWebImageCache for iOS

## Installation 

```
tns plugin add nativescript-image-cache
```

Support NativeScript ~3.0.0 with Angular


## Properties

| Property Name     	| Value        						| Platform  |
|:----------------------|:----------------------------------|:----------|
| `stretch`       		| aspectFill, aspectFit, fill, none |ios,android|
| `src`           		| string      					    |ios,android|
| `placeholder`   		| string      					    |ios,android|
| `placeholderStretch`  | aspectFill, aspectFit, fill, none |android	|
| `radius`   			| number      					    |android    |
| `rounded`   			| boolean      					    |android    |


## Basic Usage

### Nativescript Angular

Initialization 

```ts
import { initializeOnAngular } from 'nativescript-image-cache';

export class AppComponent {
    constructor () {
        initializeOnAngular();
    }
}
```

Example usage:

```html
<NSImage #myImage stretch="aspectFill" radius="20" src="res://logo">
</NSImage>
```

### Nativescript Vanilla

Initialization (android only)

```js
const imageCache = require('nativescript-image-cache');

if (application.android) {
    application.on('launch', () => {
        imageCache.initialize();
    });
}
```

Example usage:

```xml
<Page xmlns:IC="nativescript-image-cache">
    <GridLayout rows='*' columns='*'> 
        <IC:NSImage stretch="fill" row="0"
            col="0" placeholder="res://placeholder" 
            src="res://logo">
            </IC:NSImage>  
    </GridLayout>
</Page>
```

## Caching Image

Default cache purge time can be specified in number of days.

```ts
import { setCacheLimit } from 'nativescript-image-cache';

const cacheLimitInDays : number = 7;
setCacheLimit(cacheLimitInDays);
```

## Clearing Cache

Default cache time for SDWebImageCache is 7 days, and for Fresco is 60 days.

```ts
import { clearCache } from 'nativescript-image-cache';

clearCache();
```

**(Android Only), you need to initialize in the application onlaunch event before clearing the cache**


## Credits 
The starting point for this plugin was [this great plugin](https://github.com/VideoSpike/nativescript-web-image-cache).

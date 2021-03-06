# Place Saver :books: #
A Chrome extension to save a place on a webpage.

## What is it? ##
Place Saver is a simple way to save a spot on a webpage when you want to pick up from where you were before - think of it as an internal bookmarking system. The individual bookmarks are called "place tags" (I would have preferred to call them bookmarks, but I was a couple of decades too late!).

To use this extension, highlight some text on a page and click the book icon, or simply use the keyboard shortcut <kbd>Ctrl</kbd> +<kbd>Shift</kbd>+<kbd>H</kbd>. Type the name for your place tag, as you will use this to identify it in future. You should see it appear in the popup, where you can always click on it every time you navigate to the page. Clicking on the name of the tag will scroll to it and create a coloured highlight. If you wish, you can customise the style of the highlight or disable it entirely in the options page.

## How can I get it? ##
This extension is now published on Chrome Web Store - follow [this](https://chrome.google.com/webstore/detail/place-saver/kmkngkcillbdklmmdkjffddbfdlnlfop?hl=en-GB&authuser=0 "Placesaver") link to download and use it. If you want to modify or contribute to this extension, clone this repo and go to <chrome://extensions/> -- here you can turn on Developer mode & select Load Unpacked. Open your working directory to load the extension and from here you can test your changes and submit pull requests.

## How was it made? ##
This extension is built on top of the [Selection](https://developer.mozilla.org/en-US/docs/Web/API/Selection "Selection API") and [Range](https://developer.mozilla.org/en-US/docs/Web/API/Range "Range API") APIs. I used the [MV3 Chrome Developer Docs](https://developer.chrome.com/docs/extensions/mv3/ "MV3 Chrome Developer Docs") as a reference for best practices and Chrome APIs.

## Contact me ##
Feel free to get in touch with me at basil.eagle@gmail.com.

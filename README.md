# asg.js

Autocomplete plugin for jQuery that takes an input and adds functionality for local or AJAX autocomplete.

Updated: January 2016

***

## Initialization:

```javascript
$('#my-input').asg({
	source: ['Africa', 'Antarctica', 'Asia', 'Australia', 'Europe', 'North America', 'South America']
});
```

[Source] may be an array of raw strings, a function (described below), or an array of objects of the form: 
```javascript
[
    {
	key: '1', 
	value: 'My Label', 
	img: 'http://...' // (Optional)
    },
    // ...
```

To pass a function as the source, it must take three parameters: (key, valuePartial, callback).

- Key: will generally be null, but you must be able to retrieve an item if given the key.
- Partial Value: Incomplete input provided by the user. Match it with a list of suggestions.
- Callback: Once you have a suggestion list, call this function and pass the list (array) as the parameter.

Here's a simple example of a `source` function, calling server-side AJAX hooks which would be expected to return arrays of suggestions. If your server return something different, you may of course process the response before passing things on to `callback`.

```javascript
function (key, valuePartial, callback) {
	if (key) {
		$.ajax('/lookup-key/' + key, { success: callback });
	} else {
		$.ajax('/lookup-value', {
			data: valuePartial,
			success: callback
		}
	}
}
```

A full list of all initialization options is available 
[below](#options).


## Using the Plugin:

You may call the following functions:

```javascript
var asgObj = $('#my-input').data('asg');

asgObj.get(); // Returns {key: , value: }
asgObj.set(key, value);
asgObj.clear();
asgObj.destroy; // Unbinds all events and removes HTML.
```

You may also call methods directly on the input, as follows:

```javascript
$('#my-input').asg('get');
$('#my-input').asg('set', key, value);
// ...
```


## Options

The following options are available:

* `source: null` An array or function, as described 
[above](#initialization).

* `namespace: 'asg'` Prefix added to plugin's HTML elements, for your CSSing pleasure.

* `classes: []` Additional class added to the wrapping element, to allow custom
styling of the plugin in different contexts.

* `callback: function () {}` Will be called each time the input's value updates.

* `delay: 300` Time, in milliseconds, that the plugin waits for further user input
before requesting suggestions from the autosuggest `source`. If the performance of
the source is an issue, consider increasing this delay to prevent extra calls.

* `minChars: 1` Minimum number of characters that must be typed before suggestions
are shown. If 0, suggestions will be shown immediately when the input is focused.

* `offsetTop: 7` Padding between the list of suggestions and the input.

* `putAbove: false` By default, suggestions are shown below the input. This option allows
that behavior to be changed.

* `putLeft: false` Causes longer suggestions to overflow to the left, rather than the right.

* `numToSuggest: 10` Depending on the number of matches found, the plugin will display
*at most* this many suggestions.

* `leadingWildcard: false` *Only applies when source is an array.* If true, user input may
match any part of an option for that suggestion to be shown. For example, if the input 
'arm' is given, a suggestion for 'Charmander' will be shown only if this option is set to `true`.

* `boldMatches: false` Add a bold styling to the substrings within each autosuggest result
that match the user's query string. This style can be customized with the .asg-matched class.

* `keysInInput: false` Let ASG know to put keys in the text input instead of values. This
can be useful if you want your input to contain IDs, but you want to be able to search
them by their text value representation.

* `delimiter: ''` If set, this will treat the input as a delimiter-separated list, and
autocomplete will be executed on each item in this list individually. Must be a single
character.

## Contributers and Open-Source License

*Authors: Don McCurdy, David Schnurr, Dylan Wenzlau*

****

The MIT License (MIT)

Copyright (c) 2016 Graphiq, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

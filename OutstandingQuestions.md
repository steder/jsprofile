# Introduction #

Open implementation questions.

# Questions #

## Getting the Functions ##

In Firefox, functions and variable declared in the default scope are accessible by enumerating the properties of the `window` object. However, this is not the case for IE (see
http://groups.google.com/group/comp.lang.javascript/browse_thread/thread/6f97f69139a1fee5). My current workaround idea involves:
  1. Getting the `<script>` content, using AJAX if necessary when the content is externally referenced via the `src` attribute.
  1. ~~Parsing it using Narcissus (http://lxr.mozilla.org/mozilla/source/js/narcissus/)~~ Narcissus is way too slow for us. Use a custom parser to quickly determine possible variable and function names.
  1. Get the nested functions by drilling down from the `window`-scoped objects.

## Getting Dynamically Created Functions ##

Javascript functions may be created on the fly. We'd still like to profile them, but in order to do so the new functions would have to be detected as they're created, and decorated right then. I can't yet think of an easy way to do this in pure javascript.
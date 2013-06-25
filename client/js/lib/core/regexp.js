RegExp.implement = Object.implement.bind(RegExp);
RegExp.complement = Object.complement.bind(RegExp);

RegExp.SPACE = /\s+/;
RegExp.SPACE_GLOBAL = /\s+/g;
RegExp.SPACE_TRAILING_GLOBAL = /^\s+|\s+$/g;

RegExp.WORD_GLOBAL = /\b[a-z]/g;
RegExp.SPECIAL_GLOBAL = /([-.*+?^${}()|[\]\/\\])/g;

RegExp.ALPHANUM = /^[a-zA-Z0-9_]*$/;


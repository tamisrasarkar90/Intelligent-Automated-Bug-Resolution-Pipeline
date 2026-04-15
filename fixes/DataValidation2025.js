ï»¿/*!**************************Confidential and Proprietary*****************************
* File Name: DataValidation2025.js
********************Copyright (c) Hyland Software, Inc. 1992-2025********************/

/*
Languages that claim to be supported by this file:


Note: When adding regular expressions for validation, the Unicode escaped value should always be used.
		"ar-ae":	arabic (united arab emirates)
		"ar-bh":	arabic (bahrain)
		"ar-dz":	arabic (algeria)
		"ar-eg":	arabic (egypt)
		"ar-iq":	arabic (iraq)
		"ar-jo":	arabic (jordan)
		"ar-kw":	arabic (kuwait)
		"ar-lb":	arabic (lebanon)
		"ar-ly":	arabic (libya)
		"ar-ma":	arabic (morocco)
		"ar-om":	arabic (oman)
		"ar-qa":	arabic (qatar)
		"ar-sa":	arabic (saudi arabia)
		"ar-sy":	arabic (syria)
		"ar-tn":	arabic (tunisia)
		"ar-ye":	arabic (yeman)
		"bs":		bosnian
		"bs-ba":	bosnian (latin, bosnia)
		"bs-latn-ba": bosnian (latin, bosnia)
		"cs":		Czech
		"cs-cz":	Czech (Czech Republic)
		"da":		danish
		"da-dk":	danish (denmark)
		"de":		german
		"de-de":	german (germany)
		"de-at":	german (austria)
		"de-ch":	german (switzerland)
		"de-li":	german (liechtenstein)
		"de-lu":	german (luxembourg)
		"el":		greek (greece)
		"el-gr":	greek (greece)
		"en-au":	english (australian)
		"en-bz":	english (Belize)
		"en-ca":	english (canada)
		"en-cb":	english (caribbean)
		"en-029":   english (caribbean)
		"en-gb":	english (united kingdom)
		"en-ie":	english (ireland)
		"en-jm":	english (jamaica)
		"en-in":	english (india)
		"en-my":	english (malaysia)
		"en-sg":	english (singapore)
		"en-nz":	english (new zealand)
		"en-ph":	english (Philippines)
		"en-tt":	english (Trinidad)
		"en-us":	english (united states)
		"en-za":	english (South Africa)
		"en-zw":	english (Zimbabwe)
		"es":		spanish
		"es-es":	spanish (spain)
		"es-ar":	spanish (argentina)
		"es-bo":	spanish (bolivia)
		"es-cl":	spanish (chile)
		"es-co":	spanish (columbia)
		"es-cr":	spanish (costa rica)
		"es-do":	spanish (dominican republic)
		"es-ec":	spanish (ecuador)
		"es-gt":	spanish (guatemala)
		"es-hn":	spanish (honduras)
		"es-mx":	spanish (mexico)
		"es-ni":	spanish (nicaragua)
		"es-pa":	spanish (panama)
		"es-pe":	spanish (peru)
		"es-pr":	spanish (puerto rico)
		"es-py":	spanish (paraguay)
		"es-sv":	spanish (el salvador)
		"es-uy":	spanish (uruguay)
		"es-ve":	spanish (venezuela)
		"es-us":	spanish (united states)
		"fi":		finnish
		"fi-fi":	finnish (finland)
		"fr":		french
		"fr-fr":	french (france)
		"fr-mc":	french (monaco)
		"fr-be":	french (belgium)
		"fr-ca":	french (canada)
		"fr-ch":	french (switzerland)
		"fr-lu":	french (luxembourg)
		"hr":		croatian
		"hr-hr":	croatian (croatia)
        "hu":       hungarian
        "hu-hu":    hungarian (hungary)
		"id":		indonesian
		"id-id":	indonesian (indonesia)
		"it":		italian
		"it-it":	italian (italy)
		"it-ch":	italian (switzerland)
		"ja":		japanese
		"ja-jp":	japanese (japan)
		"ko":		korean
		"ko-kr":	korean (korea)
		"ms":		malay
		"ms-bn":	malay (brunei darussalam)
		"ms-my":	malay (malaysia)
		"nb-no":	norwegian, bokmal (norway)
		"nl":		dutch
		"nl-nl":	dutch (netherlands)
		"nl-be":	dutch (belgium)
		"no":		norwegian
		"nn-no":	norwegian (nynorsk)
		"pl":		polish
		"pl-pl":	polish (poland)
		"pt":		portuguese
		"pt-pt":	portuguese (portugal)
		"pt-br":	portuguese (brazil)
		"ro":		romanian(romania)
		"ro-ro":	romanian(romania)
		"ru":		russian
		"ru-ru":	russian (russia)
		"sk":		slovak
		"sk-sk":	slovak (slovakia)
		"sl":		slovenian
		"sl-sl":	slovenian (slovenia)
		"sr":       serbian
		"sr-rs":    serbian (cyrillic serbia)
		"sr-cyrl-rs": serbian (cyrillic serbia)
		"sv":		swedish
		"sv-fi":	swedish (finland)
		"sv-se":	swedish (sweden)
		"th":		thai
		"th-th":	thai (thailand)
		"tr":		turkish
		"tr-tr":	turkish (turkey)
        "vi":       vietnamese
        "vi-vn":    vietnamese (vietnam)
		"zh-cn":	chinese (china)
		"zh-sg":	chinese (singapore)
		"zh-hk":	chinese (hong kong)
		"zh-mo":	chinese (macao s.a.r.)
		"zh-tw":	chinese (taiwan)
		"ob-hy":	hyland onbase
*/

/* exported DataValidation */

var DataValidation = (function (parseInt64, $OB)
{
	var virtualRoot = $OB ? $OB.clientConfig.virtualRoot : "";
	var _currentCultureName = null;
	var _currentCultureInfo = null;
	var _invariantCultureInfo = null;
	var _cachedLocaleDate = {};

	// Constants:
	// Maximum allowed number of digits allowed, includes decimal
	var MAX_FLOAT_CHARACTERS = 22;
	// Absolute size of a float allowed
	var FLOAT_MAX_SIZE = 100000000000000;
	// Number of digits allowed after the decimal
	var FLOAT_MAX_PRECISION = 6;
	// Minimum valid year (SQLServer limit = 1753, Oracle limit = 1600)
	var MINIMUM_YEAR = 1753;
	// Maximum valid year
	var MAXIMUM_YEAR = 9999;
	// Maximum valid month
	var MAXIMUM_MONTH = 12;
	// Maximum valid day
	var MAXIMUM_DAY = 31;
	// Maximum length for a Small Numeric value
	var SMALLNUMERIC_MAX_LENGTH = 9;
	// Maximum length for a Large Numeric value
	var LARGENUMERIC_MAX_LENGTH = 20;

	var CharCode =
	{
		NonBreakingSpace: String.fromCharCode(160),
		CapitalAWithRingAbove: String.fromCharCode(197),
		ChineseDay: String.fromCharCode(26085),
		ChineseMonth: String.fromCharCode(26376),
		ChineseYear: String.fromCharCode(24180)
	};

	var _public = {};

	// Data Types accepted by DataValidation
	var DataType =
	{
		Null: 0,
		LargeNumeric: 1,
		AlphaNumeric: 2,
		Currency: 3,
		Date: 4,
		Float: 5,
		SmallNumeric: 6,
		DateTime: 9,
		AlphaNumericSingleTable: 10,
		SpecificCurrency: 11,
		AlphaNumericCSInsensitiveSearch: 12,
		AlphaNumericSingleTableCSInsensitiveSearch: 13,
		WorkviewBoolean: 15
	};
	_public.DataType = DataType;

	// Validation error indicators
	var Error =
	{
		// Number of digits after the decimal is greater than allowed
		FloatPrecision: false,
		// Value parsed is longer than allowed
		MaxLength: false,
		// Parsing a numeric type that is not numeric
		NonNumeric: false,
		// Value parsed is outside allowable range
		OutsideRange: false
	};
	_public.Error = Error;

	// Initialize DataValidation with the user's current and invariant cultures
	_currentCultureName = getUsersCulture();
	_currentCultureInfo = getCultureInfo(_currentCultureName);
	_invariantCultureInfo = getCultureInfo("en-us");

	/*******************
	* Public Functions *
	*******************/

	// Adds culture-specific currency formatting to a number.  Removes group separators.
	_public.applyCurrencyFormat = function (data)
	{
		var formattedCurrency = null;

		if (data)
		{
			var parsedCurrency = parseCurrency(_currentCultureInfo, data);
			if (parsedCurrency !== null)
			{
				formattedCurrency = localizeCurrency(_currentCultureInfo, parsedCurrency, false);
				formattedCurrency = stripGroupSeparator(formattedCurrency, _currentCultureInfo.digitGroupSeparatorRegex);
			}
		}
		else
		{
			formattedCurrency = data;
		}

		return formattedCurrency;
	};

	// Returns an object containing format information for the current culture
	_public.getCurrentFormat = function ()
	{
		var currentFormatInfo =
		{
			"dateFormat": _currentCultureInfo.dateFormat,
			"dateOrder": _currentCultureInfo.dateOrder,
			"dateSeparator": _currentCultureInfo.dateSeparator,
			"dateText": _currentCultureInfo.dateText,
			"dateTimeFormat": _currentCultureInfo.dateTimeFormat,
			"yearOffset": _currentCultureInfo.yearOffset,
			"decimalSeparator": _currentCultureInfo.decimalSeparator,
			"currencyDecimalSeparator": _currentCultureInfo.currencyDecimalSeparator,
			"digitGroupSeparator": _currentCultureInfo.digitGroupSeparator,
			"timeSeparator": _currentCultureInfo.timeSeparator,
			"maxFloatCharacters": MAX_FLOAT_CHARACTERS,
			"timeText": _currentCultureInfo.timeText,
			"hasTimeSymbolPrefix": _currentCultureInfo.hasTimeSymbolPrefix,
			"timeConvention": _currentCultureInfo.timeConvention,
			"amText": _currentCultureInfo.amText,
			"pmText": _currentCultureInfo.pmText
		};
		return currentFormatInfo;
	};

	// Sets the current culture for DataValidation
	_public.setCurrentCulture = function (cultureName)
	{
		_currentCultureName = cultureName;
		_currentCultureInfo = getCultureInfo(cultureName);
	};

	// Converts data from invariant (en-US) to a culture-specific format
	// Returns an emptry string if passed an empty string; returns null if the data is invalid
	// This function will not affect numeric or alphanumeric keywords (even masked ones)
	_public.localizeData = function (data, dataType, dataLength, mask, staticCharacters, full, bFormattedCurrency)
	{
		var localizedData = null;

		if (data)
		{
			var dataTypeNum = parseInt64(dataType);
			// Validate invariant data by parsing into pieces
			var parsedData = parseData(_invariantCultureInfo, data, dataTypeNum, dataLength, mask, staticCharacters, full);
			if (parsedData !== null)
			{
				// Localize to current culture
				localizedData = localize(_currentCultureInfo, parsedData, dataTypeNum, bFormattedCurrency, mask, staticCharacters);
			}
		}
		else
		{
			localizedData = data;
		}

		return localizedData;
	};

	//To fetch the date format
	_public.localizeDateFormat = function () {
		return _currentCultureInfo.dateFormat || "";
	};

	//To fetch the date time format
	_public.localizeDateTimeFormat = function () {
		return _currentCultureInfo.dateTimeFormat || "";
	};

	// Applies a mask of static characters to alphanumeric data
	// Example: changes 1234567890 to 123-456-7890
	function maskAlphaNumeric(data, mask, staticCharacters)
	{
		var strOutData = '';
		var staticPtr = 0;
		var maskPtr;
		var dataPtr = 0;
		var maskChar;
		for (maskPtr = 0; maskPtr < mask.length; maskPtr++)
		{
			maskChar = mask.charAt(maskPtr);
			if (maskChar === 'S')
			{
				strOutData = strOutData + staticCharacters.charAt(staticPtr);
				staticPtr++;
			}
			else
			{
				if (data.length <= dataPtr)
				{
					break;
				}
				strOutData = strOutData + data.charAt(dataPtr);
				dataPtr++;
			}
		}
		return strOutData;
	}
	_public.maskAlphaNumeric = maskAlphaNumeric;

	// Converts data from culture-specific to an invariant (en-US) format
	// Returns an emptry string if passed an empty string; returns null if the data is invalid
	// This function will not affect numeric or alphanumeric keywords (even masked ones)
	_public.normalizeData = function (data, dataType, dataLength, mask, staticCharacters, full)
	{
		var normalizedData = null;

		if (data)
		{
			var dataTypeNum = parseInt64(dataType);
			// Validate culture-specific data by parsing into pieces
			var parsedData = parseData(_currentCultureInfo, data, dataTypeNum, dataLength, mask, staticCharacters, full);
			if (parsedData !== null)
			{
				// Localize to invariant culture
				normalizedData = localize(_invariantCultureInfo, parsedData, dataTypeNum, null, mask, staticCharacters);

				// Strip grouping symbols only for unformatted currency values
				if (dataType === DataType.Currency)
				{
					normalizedData = normalizedData.replace(new RegExp(_invariantCultureInfo.digitGroupSeparator, "ig"), "");
				}
			}
		}
		else
		{
			normalizedData = data;
		}

		return normalizedData;
	};

	//Remove the spaces from between the static characters. This is required when using some
	//static formats because the other functions expect no spaces between the statics.
	//Example: Changes "   -   -   " to "---"
	_public.packStaticCharacters = function (mask, staticCharacters)
	{
		var maskPtr;
		var packedStaticCharacters = "";
		for (maskPtr = 0; maskPtr < mask.length; maskPtr++)
		{
			if (mask.charAt(maskPtr) === 'S')
			{
				packedStaticCharacters = packedStaticCharacters + staticCharacters.charAt(maskPtr);
			}
		}

		return packedStaticCharacters;
	};

	// Remove currency symbol from currency value
	_public.removeCurrencySymbol = function (currencyValue)
	{
		if (currencyValue.length === 0)
		{
			return currencyValue;
		}

		// Validate and parse data with current culture
		var parsedData = parseData(_currentCultureInfo, currencyValue, DataType.Currency);
		if (parsedData === null)
		{
			return currencyValue;
		}

		// then generate the value without currency symbol
		var returnValue = parsedData.integerPart;
		if (_currentCultureInfo.currencyHasDecimalPart && parsedData.decimalPart !== null)
		{
			returnValue += _currentCultureInfo.currencyDecimalSeparator + parsedData.decimalPart;

			if (parsedData.decimalPart.length < 2)
			{
				returnValue += "0";
			}
			if (parsedData.decimalPart.length < 1)
			{
				returnValue += "0";
			}
		}

		// add negative sign if necessary
		if (parsedData.isNegative)
		{
			returnValue = "-" + returnValue;
		}

		return returnValue;
	};

	// Validate data based on current culture. An empty string will always return true
	_public.validateData = function (data, dataType, dataLength, mask, staticCharacters, full, allowNewLine)
    {
		if (data.length === 0)
        {
			return true;
		}

        var parsedData = parseData(_currentCultureInfo, data, parseInt64(dataType), dataLength, mask, staticCharacters, full, allowNewLine);

        if ((typeof ($OB) !== "undefined"))
        {
            if (parsedData !== null && $OB.utils.exists(parsedData.Error) && parsedData.Error.length > 0)
            {
                parsedData = null;
            }
        }

		return parsedData !== null;
	};

	// Validate data based on invariant culture (en-US). An empty string will always return true
	_public.validateInvariantData = function (data, dataType, dataLength, mask, staticCharacters, full, allowNewLine)
	{
		if (data.length === 0)
		{
			return true;
		}

		var parsedData = parseData(_invariantCultureInfo, data, parseInt64(dataType), dataLength, mask, staticCharacters, full, allowNewLine);
		return parsedData !== null;
	};

	// Validate if the data conforms to the mask
    function validateMask(data, mask, staticCharacters, full, definitions)
    {
        if (definitions === undefined)
        {
            //Default definitions
            definitions = {
                'X': '.',
                '0': '[0-9]',
                '9': '[-.+*0-9]',

                // also need to include characters in the extended ASCII range with accents,
				// with the exception of \u00D7(multiplication sign) and \u00F7(division sign).
                'A': '[a-zA-Z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u00FF]'
            }
        }

        //Build regex from mask string
        var maskLength = mask.length;
        //Only use part of mask if allowed
        if (data.length < maskLength && !(parseInt64(full)))
        {
            maskLength = data.length;
        }
        var maskRegEx;
        var staticPtr = 0;
        var strRegEx = '^';
        for (var x = 0; x < maskLength; x++)
        {
            var maskCharacter = mask.charAt(x);
            switch (maskCharacter)
            {
                case 'X':
                case '0':
                case '9':
                case 'A':
                    strRegEx = strRegEx + definitions[maskCharacter];
                    break;

                case 'S':
                    var codeString = staticCharacters.charCodeAt(staticPtr).toString(16);
                    while (codeString.length < 4)
                    {
                        codeString = '0' + codeString;
                    }
                    strRegEx = strRegEx + '\\u' + codeString;
                    staticPtr++;
                    break;

                default:
                    // Ignore invalid mask characters
                    break;
            }
        }
		strRegEx = strRegEx + '$';
		maskRegEx = new RegExp(strRegEx);
		return maskRegEx.test(data);
	}
	_public.validateMask = validateMask;

	// Takes in two dates and returns if the date range is valid
	_public.validateNormalizedDateRange = function (strFromDate, strToDate)
	{
		var isValid = false;
		if (isArabicLocale())
		{
			isValid = validateLocaleDateRange(strFromDate, strToDate);
		}
		else
		{
			isValid = (convertForComparison(strFromDate) <= convertForComparison(strToDate));
		}
		return isValid;
	};

	function isUnicode()
	{
		var useUnicode = typeof (__UseUnicode) === "boolean" ? __UseUnicode : false;

		isUnicode = function ()
		{
			return useUnicode;
		};

		return useUnicode;
	}

	// Determines the byte length of a string
	// Optionally accepts an object of { character : byteLength, ... } pairs to override specific characters' byte lengths
	_public.getStringByteLength = function (value, overrideCharacters, cultureInfo)
	{
		var byteLength = 0;

		if (isUnicode() && !overrideCharacters)
		{
			byteLength = value.length;
		}
		else
		{
			cultureInfo = cultureInfo || _currentCultureInfo;
			for (var i = 0; i < value.length; i++)
			{
				var character = value.charAt(i);
				if (overrideCharacters && overrideCharacters[character])
				{
					byteLength += overrideCharacters[character];
				}
				else
				{
					byteLength += _public.getCharByteLength(character, cultureInfo);
				}
			}
		}

		return byteLength;
	};

	_public.getCharByteLength = function (value, cultureInfo)
	{
		cultureInfo = cultureInfo || _currentCultureInfo;

		if (isUnicode() || cultureInfo.singleByteMatch.test(value))
		{
			return 1;
		}
		return 2;
	};

	_public.parseCurrency = function (data)
	{
		return parseCurrency(_currentCultureInfo, data);
	};

	/********************
	* Private Functions *
	********************/

	// Captures the pieces of a date
	function captureDate(cultureInfo, captureArray)
	{
		var splitDate = null;

		var yearIndex = null;
		var monthIndex = null;
		var dayIndex = null;
		switch (cultureInfo.dateOrder)
		{
			case 'dmy':
				dayIndex = 1;
				monthIndex = 3;
				yearIndex = 4;
				break;

			case 'ymd':
				yearIndex = 1;
				monthIndex = 3;
				dayIndex = 4;
				break;

			case 'mdy':
				/* falls through */
			default:
				monthIndex = 1;
				dayIndex = 3;
				yearIndex = 4;
				break;
		}

		var year = parseInt64(captureArray[yearIndex]);
		var month = parseInt64(captureArray[monthIndex]);
		var day = parseInt64(captureArray[dayIndex]);

		// Remove the year offset
		year -= cultureInfo.yearOffset;

		//Ensure parts are in range for program.
		var validRanges = false;
		if (year >= MINIMUM_YEAR && year <= MAXIMUM_YEAR
			&& month > 0 && month <= MAXIMUM_MONTH
			&& day > 0 && day <= MAXIMUM_DAY)
		{
			validRanges = true;
		}

		//Ensure day is in range for month/year
		var validYearMonthDay = true;

		//Find number of days in month
		var tempDate = null;
		//Create date of first day in following month
		if (month === MAXIMUM_MONTH)
		{
			tempDate = Date.UTC(year + 1, 0, 1);
		}
		else
		{
			tempDate = Date.UTC(year, month, 1);
		}

		//Subtract one ms and read day
		tempDate = (new Date(tempDate.valueOf() - 1));
		var lastDay = tempDate.getUTCDate();
		if (day > lastDay)
		{
			validYearMonthDay = false;
		}

		if (validRanges && validYearMonthDay)
		{
			splitDate = {
				year: year,
				month: month,
				day: day
			};
		}

		return splitDate;
	}

	// Converts a date for comparing. Used by validateNormalizedDateRange
	function convertForComparison(dateString)
	{
		var date = new Date(dateString);
		var newDateString = "" + date.getFullYear();

		if (date.getMonth() < 9)
		{
			newDateString += "0";
		}

		newDateString += (date.getMonth() + 1);

		if (date.getDate() < 10)
		{
			newDateString += "0";
		}

		newDateString += date.getDate();

		return newDateString;
	}

	// Gets a culture information object for the specified culture name
	// Only two characters are needed to represent the default locale of a language (example: 'es' for Spanish(Spain) instead of 'es-es')
	function getCultureInfo(cultureName)
	{
		var cultureInfo =
		{
			decimalSeparator: null,
			decimalSeparatorRegex: null,
			currencyDecimalSeparator: null,
			currencyDecimalSeparatorRegex: null,
			digitGroupSeparator: null,
			digitGroupSeparatorRegex: null,
			currencyHasDecimalPart: null,
			positiveNumberText: null,
			positiveNumericRegex: null,
			positiveFloatRegex: null,
			currencyRegex: null,
			currencyRegexNegative: null,
			currencyRegexNegativeAlt: null,
			currencyFormat: null,
			currencyFormatNegative: null,
			dateOrder: null,
			dateText: null,
			dateSeparator: null,
			yearOffset: null,
			dateFormat: null,
			timeText: null,
			timeConvention: null,
			timeSeparator: null,
			hasTimeSymbolPrefix: null,
			amText: null,
			pmText: null,
			dateTimeFormat: null,
			singleByteMatch: null
		};

		// Several newer locales are available in Windows Vista and Windows 7.
		// Change these to a known supported locale until support can be added in a later release.
		cultureName = replaceUnsupportedLocale(cultureName);

		// Determine number separators
		switch (cultureName)
		{
			case 'bs':
			case 'bs-ba':
			case 'bs-latn-ba':
			case 'da':
			case 'da-dk':
			case 'de':
			case 'de-at':
			case 'de-de':
			case 'de-lu':
			case 'el':
			case 'el-gr':
			case 'es':
			case 'es-es':
			case 'es-ar':
			case 'es-bo':
			case 'es-cl':
			case 'es-co':
			case 'es-ec':
			case 'es-py':
			case 'es-uy':
			case 'es-ve':
			case 'fr-be':
			case 'fr-lu':
			case 'hr':
			case 'hr-hr':
			case 'id':
			case 'id-id':
			case 'it':
			case 'it-it':
			case 'ms-bn':
			case 'nl':
			case 'nl-be':
			case 'nl-nl':
			case 'pt':
			case 'pt-br':
			case 'ro':
			case 'ro-ro':
			case 'sl':
			case 'sl-sl':
			case 'sl-si':
			case 'sr':
			case 'sr-rs':
            case 'sr-cyrl-rs':
			case 'tr':
            case 'tr-tr':
            case 'vi':
            case 'vi-vn':
				cultureInfo.decimalSeparator = ",";
				cultureInfo.decimalSeparatorRegex = ",";
				cultureInfo.digitGroupSeparator = ".";
				cultureInfo.digitGroupSeparatorRegex = "\\.";
				break;
			case 'de-ch':
			case 'de-li':
			case 'it-ch':
				cultureInfo.decimalSeparator = ".";
				cultureInfo.decimalSeparatorRegex = "\\.";
				cultureInfo.digitGroupSeparator = "\u2019";
				cultureInfo.digitGroupSeparatorRegex = "[\u0027\u2019]";
				break;
			case 'fr-ch':
				cultureInfo.currencyDecimalSeparator = ".";
				cultureInfo.currencyDecimalSeparatorRegex = "\\.";
				cultureInfo.decimalSeparator = ",";
				cultureInfo.decimalSeparatorRegex = ",";
				cultureInfo.digitGroupSeparator = CharCode.NonBreakingSpace;
				cultureInfo.digitGroupSeparatorRegex = "[\u00A0\u0020]"; // Non-breaking Space and Space
				break;
			case 'cs':
			case 'cs-cz':
			case 'en-za':
			case 'es-cr':
			case 'fi':
			case 'fi-fi':
			case 'fr':
			case 'fr-ca':
			case 'fr-fr':
            case 'fr-mc':
            case 'hu':
            case 'hu-hu':
			case 'nn-no':
			case 'nb-no':
			case 'no':
			case 'pl':
			case 'pl-pl':
			case 'pt-pt':
			case 'ru':
			case 'ru-ru':
			case 'sk':
			case 'sk-sk':
			case 'sv':
			case 'sv-se':
			case 'sv-fi':
				cultureInfo.decimalSeparator = ",";
				cultureInfo.decimalSeparatorRegex = ",";
				cultureInfo.digitGroupSeparator = CharCode.NonBreakingSpace;
				cultureInfo.digitGroupSeparatorRegex = "[\u00A0\u0020]"; // Non-breaking Space and Space
				break;
			case 'ob-hy':
				cultureInfo.decimalSeparator = ",";
				cultureInfo.decimalSeparatorRegex = ",";
				cultureInfo.digitGroupSeparator = ".";
				cultureInfo.digitGroupSeparatorRegex = "\\.";
				break;
				//ar-ae, ar-bh, ar-eg, ar-iq, ar-jo, ar-kw, ar-lb, ar-ly, ar-ma, ar-om, ar-qa, ar-sa, ar-sy, ar-tn, ar-ye,
				//en-029, en-au, en-bz, en-ca, en-cb, en-gb, en-ie, en-in, en-jm, en-my, en-nz, en-ph, en-sg, en-tt, en-us,
				//en-zw, es-do, es-gt, es-hn, es-mx, es-ni, es-pa, es-pe, es-pr, es-sv, es-us, ja, ja-jp, ko, ko-kr, ms, ms-my
				//th, zh-cn, zh-hk, zh-sg, zh-mo, zh-tw
			default:
				cultureInfo.decimalSeparator = ".";
				cultureInfo.decimalSeparatorRegex = "\\.";
				cultureInfo.digitGroupSeparator = ",";
				cultureInfo.digitGroupSeparatorRegex = ",";
				break;
		}

		// In almost every case, the currency decimal separator is the same as the standard decimal separator, so we won't have set it in the above switch statement
		// If we didn't set it then, set it equal to the standard decimal separator
		if (cultureInfo.currencyDecimalSeparator === null)
		{
			cultureInfo.currencyDecimalSeparator = cultureInfo.decimalSeparator;
        }

		if (cultureInfo.currencyDecimalSeparatorRegex === null)
		{
			cultureInfo.currencyDecimalSeparatorRegex = cultureInfo.decimalSeparatorRegex;
		}

		// Determine if the currency has a decimal part
		switch (cultureName)
		{
			case 'es-cl':
			case 'es-py':
			case 'ja':
			case 'ja-jp':
			case 'ko':
			case 'ko-kr':
				cultureInfo.currencyHasDecimalPart = false;
				break;
			default:
				cultureInfo.currencyHasDecimalPart = true;
				break;
		}

		//Generate number strings (assume decimal currency is in cents of a unit)
		// The currency regex checks for several things (the answer must be yes to all questions to pass):
		// -Is the string before the decimal less than 17 digits?
		// -If digits are being grouped, are they being put into groups of three?
		// -If a decimal amount is present, is it specified to exactly two decimal places?
		var currencyNumberText = '(?:((?:\\d{1,2}(' + cultureInfo.digitGroupSeparatorRegex +
										'\\d{3}){0,5})|(?:\\d{2,3}(' + cultureInfo.digitGroupSeparatorRegex +
										'\\d{3}){0,4})|(?:\\d{1,17}))?' + (cultureInfo.currencyHasDecimalPart ?
										'(?:' + cultureInfo.currencyDecimalSeparatorRegex + '(\\d{2}))?' : '') + ')';

		cultureInfo.positiveNumberText = '(?:(?:(\\d*)' + cultureInfo.decimalSeparatorRegex + '(\\d+))|(?:(\\d+)))';
		cultureInfo.numericRegex = /^(?:(-))?(\d+)$/;
		cultureInfo.floatRegex = new RegExp('^(?:(-)?)' + cultureInfo.positiveNumberText + '$');

		// Determine currency formats
		switch (cultureName)
		{
			case 'ar-ae':
				cultureInfo.currencyRegex = new RegExp('^(\\u062F\\u002E\\u0625\\u002E)?\\u200F?\\s*' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0625\\u002E)?\\u200F?$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u062F\\u002E\\u0625\\u002E)?\\u200F?\\s*-' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0625\\u002E)?\\u200F?$');
				cultureInfo.currencyFormat = "{0} \u062F\u002E\u0625\u002E\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u062F\u002E\u0625\u002E\u200F";
				break;

			case 'ar-bh':
				cultureInfo.currencyRegex = new RegExp('^(\\u062F\\u002E\\u0628\\u002E)?\\u200F?\\s*' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0628\\u002E)?\\u200F?$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u062F\\u002E\\u0628\\u002E)?\\u200F?\\s*-' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0628\\u002E)?\\u200F?$');
				cultureInfo.currencyFormat = "{0} \u062F\u002E\u0628\u002E\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u062F\u002E\u0628\u002E\u200F";
				break;

			case 'ar-dz':
				cultureInfo.currencyRegex = new RegExp('^(\\u062F\\u002E\\u062C\\u002E)?\\u200F?\\s*' + currencyNumberText + '\\s*(\\u062F\\u002E\\u062C\\u002E)?\\u200F?$');
				cultureInfo.currencyRegexNegative = new RegExp('^-(\\u062F\\u002E\\u062C\\u002E)?\\u200F?\\s*' + currencyNumberText + '\\s*(\\u062F\\u002E\\u062C\\u002E)?\\u200F?$');
				cultureInfo.currencyFormat = "{0} \u062F\u002E\u062C\u002E\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u062F\u002E\u062C\u002E\u200F ";
				break;

			case 'ar-eg':
				cultureInfo.currencyRegex = new RegExp('^(\\u062C\\u002E\\u0645\\u002E)?\\u200F?\\s*' + currencyNumberText + '\\s*(\\u062C\\u002E\\u0645\\u002E)?\\u200F?$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u062C\\u002E\\u0645\\u002E)?\\u200F?\\s*-' + currencyNumberText + '\\s*(\\u062C\\u002E\\u0645\\u002E)?\\u200F?$');
				cultureInfo.currencyFormat = "{0} \u062C\u002E\u0645\u002E\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u062C\u002E\u0645\u002E\u200F";
				break;

			case 'ar-iq':
				cultureInfo.currencyRegex = new RegExp('^(\\u062F\\u002E\\u0639\\u002E)?\\u200F?\\s*' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0639\\u002E)?\\u200F?$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u062F\\u002E\\u0639\\u002E)?\\u200F?\\s*-' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0639\\u002E)?\\u200F?$');
				cultureInfo.currencyFormat = "{0} \u062F\u002E\u0639\u002E\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u062F\u002E\u0639\u002E\u200F";
				break;

			case 'ar-jo':
				cultureInfo.currencyRegex = new RegExp('^(\\u062F\\u002E\\u0627\\u002E)?\\u200F?\\s*' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0627\\u002E)?\\u200F?$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u062F\\u002E\\u0627\\u002E)?\\u200F?\\s*-' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0627\\u002E)?\\u200F?$');
				cultureInfo.currencyFormat = "{0} \u062F\u002E\u0627\u002E\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u062F\u002E\u0627\u002E\u200F";
				break;

			case 'ar-lb':
				cultureInfo.currencyRegex = new RegExp('^(\\u0644\\u002E\\u0644\\u002E)?\\u200F{0,2}\\s*' + currencyNumberText + '\\s*(\\u0644\\u002E\\u0644\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u0644\\u002E\\u0644\\u002E)?\\u200F{0,2}\\s*-' + currencyNumberText + '\\s*(\\u0644\\u002E\\u0644\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyFormat = "{0} \u0644\u002E\u0644\u002E\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u0644\u002E\u0644\u002E\u200F";
				break;

			case 'ar-ly':
				cultureInfo.currencyRegex = new RegExp('^(\\u062F\\u002E\\u0644\\u002E)?\\u200F{0,2}\\s*' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0644\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u062F\\u002E\\u0644\\u002E)?\\u200F{0,2}\\s*-' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0644\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyFormat = "{0} \u062F\u002E\u0644\u002E\u200F\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u062F\u002E\u0644\u002E\u200F\u200F";
				break;

			case 'ar-kw':
				cultureInfo.currencyRegex = new RegExp('^(\\u062F\\u002E\\u0643\\u002E)?\\u200F?\\s*' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0643\\u002E)?\\u200F?$');
				cultureInfo.currencyRegexNegative = new RegExp('^-(\\u062F\\u002E\\u0643\\u002E)?\\u200F?\\s*' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0643\\u002E)?\\u200F?$');
				cultureInfo.currencyFormat = "{0} \u062F\u002E\u0643\u002E\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u062F\u002E\u0643\u002E\u200F";
				break;

			case 'ar-ma':
				cultureInfo.currencyRegex = new RegExp('^(\\u062F\\u002E\\u0645\\u002E)?\\u200F{0,2}\\s*' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0645\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u062F\\u002E\\u0645\\u002E)?\\u200F{0,2}\\s*-' + currencyNumberText + '\\s*(\\u062F\\u002E\\u0645\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyFormat = "{0} \u062F\u002E\u0645\u002E\u200F\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u062F\u002E\u0645\u002E\u200F\u200F";
				break;

			case 'ar-om':
				cultureInfo.currencyRegex = new RegExp('^(\\u0631\\u002E\\u0639\\u002E)?\\u200F{0,2}\\s*' + currencyNumberText + '\\s*(\\u0631\\u002E\\u0639\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u0631\\u002E\\u0639\\u002E)?\\u200F{0,2}\\s*-' + currencyNumberText + '\\s*(\\u0631\\u002E\\u0639\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyFormat = "{0} \u0631\u002E\u0639\u002E\u200F\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u0631\u002E\u0639\u002E\u200F\u200F";
				break;

			case 'ar-qa':
				cultureInfo.currencyRegex = new RegExp('^(\\u0631\\u002E\\u0642\\u002E)?\\u200F{0,2}\\s*' + currencyNumberText + '\\s*(\\u0631\\u002E\\u0642\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u0631\\u002E\\u0642\\u002E)?\\u200F{0,2}\\s*-' + currencyNumberText + '\\s*(\\u0631\\u002E\\u0642\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyFormat = "{0} \u0631\u002E\u0642\u002E\u200F\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u0631\u002E\u0642\u002E\u200F\u200F";
				break;

			case 'ar-sa':
				cultureInfo.currencyRegex = new RegExp('^(\\u0631\\u002E\\u0633\\u002E)?\\u200F?\\s*' + currencyNumberText + '\\s*(\\u0631\\u002E\\u0633\\u002E)?\\u200F?$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u0631\\u002E\\u0633\\u002E)?\\u200F?\\s*-' + currencyNumberText + '\\s*(\\u0631\\u002E\\u0633\\u002E)?\\u200F?$');
				cultureInfo.currencyFormat = "{0} \u0631\u002E\u0633\u002E\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u0631\u002E\u0633\u002E\u200F";
				break;

			case 'ar-sy':
				cultureInfo.currencyRegex = new RegExp('^(\\u0644\\u002E\\u0633\\u002E)?\\u200F{0,2}\\s*' + currencyNumberText + '\\s*(\\u0644\\u002E\\u0633\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u0644\\u002E\\u0633\\u002E)?\\u200F{0,2}\\s*-' + currencyNumberText + '\\s*(\\u0644\\u002E\\u0633\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyFormat = "{0} \u0644\u002E\u0633\u002E\u200F\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u0644\u002E\u0633\u002E\u200F\u200F";
				break;

			case 'ar-tn':
				cultureInfo.currencyRegex = new RegExp('^(\\u062F\\u002E\\u062A\\u002E)?\\u200F{0,2}\\s*' + currencyNumberText + '\\s*(\\u062F\\u002E\\u062A\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u062F\\u002E\\u062A\\u002E)?\\u200F{0,2}\\s*-' + currencyNumberText + '\\s*(\\u062F\\u002E\\u062A\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyFormat = "{0} \u062F\u002E\u062A\u002E\u200F\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u062F\u002E\u062A\u002E\u200F\u200F";
				break;

			case 'ar-ye':
				cultureInfo.currencyRegex = new RegExp('^(\\u0631\\u002E\\u064A\\u002E)?\\u200F{0,2}\\s*' + currencyNumberText + '\\s*(\\u0631\\u002E\\u064A\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\u0631\\u002E\\u064A\\u002E)?\\u200F{0,2}\\s*-' + currencyNumberText + '\\s*(\\u0631\\u002E\\u064A\\u002E)?\\u200F{0,2}$');
				cultureInfo.currencyFormat = "{0} \u0631\u002E\u064A\u002E\u200F\u200F";
				cultureInfo.currencyFormatNegative = "-{0} \u0631\u002E\u064A\u002E\u200F\u200F";
				break;

			case 'bs':
			case 'bs-ba':
			case 'bs-latn-ba':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(KM)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(KM)?$', 'i');
				cultureInfo.currencyFormat = "{0} KM";
				cultureInfo.currencyFormatNegative = "-{0} KM";
				break;

			case 'cs':
			case 'cs-cz':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(K\u010D)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(K\u010D)?$', 'i');
				cultureInfo.currencyFormat = "{0} K\u010D";
				cultureInfo.currencyFormatNegative = "-{0} K\u010D";
				break;

			case 'da':
			case 'da-dk':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(kr\\.?)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(kr\\.?)?$', 'i');
				cultureInfo.currencyFormat = "{0} kr.";
				cultureInfo.currencyFormatNegative = "-{0} kr.";
				break;

			case 'nn-no':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(kr)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(kr)?$', 'i');
				cultureInfo.currencyFormat = "{0} kr";
				cultureInfo.currencyFormatNegative = "-{0} kr";
				break;

			case 'no':
			case 'nb-no':
				cultureInfo.currencyRegex = new RegExp('^(kr)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-(kr)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "kr {0}";
				cultureInfo.currencyFormatNegative = " -kr {0}";
				break;

			case 'en-in':
				cultureInfo.currencyRegex = new RegExp('^(\u20B9|Rs\\.)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^(\u20B9|Rs\\.)?(?:\\s)*-' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "\u20B9 {0}";
				cultureInfo.currencyFormatNegative = "\u20B9 -{0}";
				break;

			case 'ro':
			case 'ro-ro':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(lei|RON)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(lei|RON)?$', 'i');
				cultureInfo.currencyFormat = "{0} lei";
				cultureInfo.currencyFormatNegative = "-{0} lei";
				break;

			case 'ko':
			case 'ko-kr':
				cultureInfo.currencyRegex = new RegExp('^(\u20A9|\\\\)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-(\u20A9|\\\\)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "\u20A9{0}";
				cultureInfo.currencyFormatNegative = "-\u20A9{0}";
				break;

			case 'en-my':
				cultureInfo.currencyRegex = new RegExp('^(RM)?' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-(RM)?' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "RM{0}";
				cultureInfo.currencyFormatNegative = "-RM{0}";
				break;

			case 'zh-mo':
				cultureInfo.currencyRegex = new RegExp('^(MOP)' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-(MOP)?' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "MOP{0}";
				cultureInfo.currencyFormatNegative = "-MOP{0}";
				break;

			case 'de':
			case 'de-de':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(DM|\u20AC)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(DM|\u20AC)?$', 'i');
				cultureInfo.currencyFormat = "{0} \u20AC";
				cultureInfo.currencyFormatNegative = "-{0} \u20AC";
				break;

			case 'de-li':
				cultureInfo.currencyRegex = new RegExp('^(CHF)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-(CHF)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "CHF {0}";
				cultureInfo.currencyFormatNegative = "-CHF {0}";
				break;

			case 'de-at':
				cultureInfo.currencyRegex = new RegExp('^(\u00F6S|\u20AC)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^-(\u00F6S|\u20AC)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "\u20AC {0}";
				cultureInfo.currencyFormatNegative = "-\u20AC {0}";
				break;

			case 'de-ch':
			case 'it-ch':
				cultureInfo.currencyRegex = new RegExp('^(CHF)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^(CHF)?(?:\\s)*-' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "CHF {0}";
				cultureInfo.currencyFormatNegative = "CHF -{0}";
				break;

			case 'fr-ch':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(CHF)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(CHF)?$', 'i');
				cultureInfo.currencyFormat = "{0} CHF";
				cultureInfo.currencyFormatNegative = "-{0} CHF";
				break;

			case 'de-lu':
			case 'fr':
			case 'fr-fr':
			case 'fr-lu':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(F|\u20AC)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(F|\u20AC)?$', 'i');
				cultureInfo.currencyFormat = "{0} \u20AC";
				cultureInfo.currencyFormatNegative = "-{0} \u20AC";
				break;

			case 'en-au':
			case 'en-ca':
			case 'en-nz':
			case 'en-bz':
			case 'en-jm':
			case 'es-mx':
			case 'en-sg':
			case 'zh-sg':
			case 'es-sv':
				cultureInfo.currencyRegex = new RegExp('^(\\$)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^-(\\$)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "${0}";
				cultureInfo.currencyFormatNegative = "-${0}";
				break;

			case 'en-cb':
			case 'en-029':
				cultureInfo.currencyRegex = new RegExp('^(EC\\$)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^-(EC\\$)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "EC${0}";
				cultureInfo.currencyFormatNegative = "-EC${0}";
				break;

			case 'en-gb':
				cultureInfo.currencyRegex = new RegExp('^(\u00A3)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^-(\u00A3)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "\u00A3{0}";
				cultureInfo.currencyFormatNegative = "-\u00A3{0}";
				break;

			case 'en-ie':
				cultureInfo.currencyRegex = new RegExp('^(\u20AC|IR\u00A3)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^-(\u20AC|IR\u00A3)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "\u20AC{0}";
				cultureInfo.currencyFormatNegative = "-\u20AC{0}";
				break;

			case 'en-ph':
				cultureInfo.currencyRegex = new RegExp('^(\u20B1)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((\u20B1)?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(\u20B1)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "\u20B1{0}";
				cultureInfo.currencyFormatNegative = "(\u20B1{0})";
				break;

			case 'en-tt':
				cultureInfo.currencyRegex = new RegExp('^(\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((\\$)?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "${0}";
				cultureInfo.currencyFormatNegative = "(${0})";
				break;
			case 'en-za':
				cultureInfo.currencyRegex = new RegExp('^(R)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-(R)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "R {0}";
				cultureInfo.currencyFormatNegative = "-R{0}";
				break;

			case 'en-zw':
				cultureInfo.currencyRegex = new RegExp('^((?:US\\$)|(?:Z\\$))?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-((?:US\\$)|(?:Z\\$))?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^\\(((?:US\\$)|(?:Z\\$))?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyFormat = "US${0}";
				cultureInfo.currencyFormatNegative = "-US${0}";
				break;

			case 'es':
			case 'es-es':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(pta|\u20AC)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(pta|\u20AC)?$', 'i');
				cultureInfo.currencyFormat = "{0} \u20AC";
				cultureInfo.currencyFormatNegative = "-{0} \u20AC";
				break;

			case 'es-ar':
			case 'ms-bn':
				cultureInfo.currencyRegex = new RegExp('^(\\$)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^-(\\$)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "$ {0}";
				cultureInfo.currencyFormatNegative = "-$ {0}";
				break;

			case 'es-bo':
				cultureInfo.currencyRegex = new RegExp('^((?:\\$b)|(?:Bs))?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-((?:\\$b)|(?:Bs))?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "Bs{0}";
				cultureInfo.currencyFormatNegative = "-Bs{0}";
				break;

			case 'es-cl':
				cultureInfo.currencyRegex = new RegExp('^(\\$)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^(\\$)?(?:\\s)*-' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "${0}";
				cultureInfo.currencyFormatNegative = "$-{0}";
				break;

			case 'es-co':
			case 'es-pr':
				cultureInfo.currencyRegex = new RegExp('^(\\$)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((\\$)?(?:\\s)*' + currencyNumberText + '\\)$');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(\\$)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "$ {0}";
				cultureInfo.currencyFormatNegative = "-$ {0}";
				break;

			case 'es-cr':
				cultureInfo.currencyRegex = new RegExp('^(\u20A1)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^-(\u20A1)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "\u20A1{0}";
				cultureInfo.currencyFormatNegative = "-\u20A1{0}";
				break;

			case 'es-do':
				cultureInfo.currencyRegex = new RegExp('^(\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((\\$)?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "${0}";
				cultureInfo.currencyFormatNegative = "(${0})";
				break;

			case 'es-ec':
				cultureInfo.currencyRegex = new RegExp('^(S\\/\\.|\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((S\\/\\.|\\$)?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^(S\\/\\.|\\$)?(?:\\s)*-' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "${0}";
				cultureInfo.currencyFormatNegative = "$-{0}";
				break;

			case 'es-gt':
				cultureInfo.currencyRegex = new RegExp('^(Q)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((Q)?(?:\\s)*' + currencyNumberText + '\\)$');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(Q)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "Q{0}";
				cultureInfo.currencyFormatNegative = "-Q{0}";
				break;

			case 'es-hn':
				cultureInfo.currencyRegex = new RegExp('^(L\\.?)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^(L\\.?)?(?:\\s)*-' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(L\\.?)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "L{0}";
				cultureInfo.currencyFormatNegative = "-L{0}";
				break;

			case 'es-ni':
				cultureInfo.currencyRegex = new RegExp('^(C\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((C\\$)?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(C\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "C$ {0}";
				cultureInfo.currencyFormatNegative = "-C$ {0}";
				break;

			case 'es-pa':
				cultureInfo.currencyRegex = new RegExp('^(B\\/\\.)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((B\\/\\.)?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(B\\/\\.)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "B/.{0}";
				cultureInfo.currencyFormatNegative = "-B/.{0}";
				break;

			case 'es-pe':
				cultureInfo.currencyRegex = new RegExp('^(S\\/)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^(S\\/)?(?:\\s)*-' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(S\\/)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "S/ {0}";
				cultureInfo.currencyFormatNegative = "-S/ {0}";
				break;

			case 'es-py':
				cultureInfo.currencyRegex = new RegExp('^(\u20B2|Gs)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((\u20B2|Gs)?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^(\u20B2|Gs)?(?:\\s)*-' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "\u20B2 {0}";
				cultureInfo.currencyFormatNegative = "\u20B2 -{0}";
				break;

			case 'es-uy':
				cultureInfo.currencyRegex = new RegExp('^((?:\\$U)|(?:\\$))?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\(((?:\\$U)|(?:\\$))?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-((?:\\$U)|(?:\\$))?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "$ {0}";
				cultureInfo.currencyFormatNegative = "-$ {0}";
				break;

			case 'es-ve':
				cultureInfo.currencyRegex = new RegExp('^(Bs\\.?(?:\\s*F\\.)?)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^(Bs\\.?(?:\\s*F\\.)?)?(?:\\s)*-' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "Bs.{0}";
				cultureInfo.currencyFormatNegative = "Bs.-{0}";
				break;

			case 'fi':
			case 'fi-fi':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(mk|\u20AC)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(mk|\u20AC)?$', 'i');
				cultureInfo.currencyFormat = "{0} \u20AC";
				cultureInfo.currencyFormatNegative = "-{0} \u20AC";
				break;

			case 'fr-be':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(FB|\u20AC)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(FB|\u20AC)?$', 'i');
				cultureInfo.currencyFormat = "{0} \u20AC";
				cultureInfo.currencyFormatNegative = "-{0} \u20AC";
				break;

			case 'fr-ca':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(\\$)?$');
				cultureInfo.currencyRegexNegative = new RegExp('^()\\(' + currencyNumberText + '(?:\\s)*(\\$)?\\)$');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^()-' + currencyNumberText + '(?:\\s)*(\\$)?$');
				cultureInfo.currencyFormat = "{0} $";
				cultureInfo.currencyFormatNegative = "({0} $)";
				break;

			case 'hr':
			case 'hr-hr':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(kn)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(kn)?$', 'i');
				cultureInfo.currencyFormat = "{0} kn";
				cultureInfo.currencyFormatNegative = "-{0} kn";
				break;

            case 'hu':
            case 'hu-hu':
                cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(Ft)?$', 'i');
                cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(Ft)?$', 'i');
                cultureInfo.currencyFormat = "{0} Ft";
                cultureInfo.currencyFormatNegative = "-{0} Ft";
                break;

			case 'id':
			case 'id-id':
				cultureInfo.currencyRegex = new RegExp('^(Rp)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((Rp)?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(Rp)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "Rp{0}";
				cultureInfo.currencyFormatNegative = "-Rp{0}";
				break;

			case 'it':
			case 'it-it':
				cultureInfo.currencyRegex = new RegExp('^(L\\.|\u20AC)?(?:\\s)*' + currencyNumberText + '(?:\\s)*\\u20AC?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-(L\\.|\u20AC)?(?:\\s)*' + currencyNumberText + '(?:\\s)*\\u20AC?$', 'i');
				cultureInfo.currencyFormat = "{0} \u20AC";
				cultureInfo.currencyFormatNegative = "-{0} \u20AC";
				break;

			case 'ja':
			case 'ja-jp':
				cultureInfo.currencyRegex = new RegExp('^(\u00A5|\\\\)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^-(\u00A5|\\\\)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "\u00A5{0}";
				cultureInfo.currencyFormatNegative = "-\u00A5{0}";
				break;

			case 'ms':
			case 'ms-my':
				cultureInfo.currencyRegex = new RegExp('^(RM)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((RM)?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(RM)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "RM{0}";
				cultureInfo.currencyFormatNegative = "-RM{0}";
				break;

			case 'nl':
			case 'nl-nl':
				cultureInfo.currencyRegex = new RegExp('^(fl|\u20AC)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^(fl|\u20AC)?(?:\\s)*' + currencyNumberText + '-$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^(fl|\u20AC)?(?:\\s)*-' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "\u20AC {0}";
				cultureInfo.currencyFormatNegative = "\u20AC -{0}";
				break;

			case 'nl-be':
				cultureInfo.currencyRegex = new RegExp('^(BF|\u20AC)?(?:\\s)*' + currencyNumberText + '(?:\\s)*(BF|\u20AC)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^(BF|\u20AC)?(?:\\s)*-' + currencyNumberText + '(?:\\s)*(BF|\u20AC)?$', 'i');
				cultureInfo.currencyFormat = "\u20AC {0}";
				cultureInfo.currencyFormatNegative = "\u20AC -{0}";
				break;

			case 'pl':
			case 'pl-pl':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(z\u0142)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(z\u0142)?$', 'i');
				cultureInfo.currencyFormat = "{0} z\u0142";
				cultureInfo.currencyFormatNegative = "-{0} z\u0142";
				break;

			case 'pt':
			case 'pt-br':
				cultureInfo.currencyRegex = new RegExp('^(R\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((R\\$)?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(R\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "R$ {0}";
				cultureInfo.currencyFormatNegative = "-R$ {0}";
				break;

			case 'pt-pt':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(Esc\\.|\u20AC)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(Esc\\.|\u20AC)?$', 'i');
				cultureInfo.currencyFormat = "{0} \u20AC";
				cultureInfo.currencyFormatNegative = "-{0} \u20AC";
				break;

			case 'ru':
			case 'ru-ru':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*((p|\u0440)\\.|\u20BD)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*((p|\u0440)\\.|\u20BD)?$', 'i');
				cultureInfo.currencyFormat = "{0} \u20BD";
				cultureInfo.currencyFormatNegative = "-{0} \u20BD";
				break;

			case 'sk':
			case 'sk-sk':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(\u20AC)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(\u20AC)?$', 'i');
				cultureInfo.currencyFormat = "{0} \u20AC";
				cultureInfo.currencyFormatNegative = "-{0} \u20AC";
				break;

			case 'sl':
			case 'sl-sl':
			case 'sl-si':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(\u20AC)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(\u20AC)?$', 'i');
				cultureInfo.currencyFormat = "{0} \u20AC";
				cultureInfo.currencyFormatNegative = "-{0} \u20AC";
				break;

            case 'sr':
			case 'sr-rs':
            case 'sr-cyrl-rs':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(\u0434\u0438\u043d\u002e)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(\u0434\u0438\u043d\u002e)?$', 'i');
				cultureInfo.currencyFormat = "{0} \u0434\u0438\u043d\u002e";
				cultureInfo.currencyFormatNegative = "-{0} \u0434\u0438\u043d\u002e";
                break;

			case 'sv':
			case 'sv-se':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(kr)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(kr)?$', 'i');
				cultureInfo.currencyFormat = "{0} kr";
				cultureInfo.currencyFormatNegative = "-{0} kr";
				break;

			case 'th':
			case 'th-th':
				cultureInfo.currencyRegex = new RegExp('^(\u0E3F)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^-(\u0E3F)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "\u0E3F{0}";
				cultureInfo.currencyFormatNegative = "-\u0E3F{0}";
				break;

			case 'tr':
			case 'tr-tr':
				cultureInfo.currencyRegex = new RegExp('^(TL|\u20BA)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = RegExp('^-(TL|\u20BA)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "\u20BA{0}";
				cultureInfo.currencyFormatNegative = "-\u20BA{0}";
                break;

            case 'vi':
            case 'vi-vn':
                cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(\u20AB)?$', 'i');
                cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(\u20AB)?$', 'i');
                cultureInfo.currencyFormat = "{0} \u20AB";
                cultureInfo.currencyFormatNegative = "-{0} \u20AB";
                break;

			case 'zh-cn':
				cultureInfo.currencyRegex = new RegExp('^([\u00A5\uFFE5])?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^([\u00A5\uFFE5])?(?:\\s)*-' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "\u00A5{0}";
				cultureInfo.currencyFormatNegative = "\u00A5-{0}";
				break;

			case 'zh-hk':
				cultureInfo.currencyRegex = new RegExp('^(HK\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((HK\\$)?(?:\\s)*' + currencyNumberText + '\\)$', 'i');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(HK\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "HK${0}";
				cultureInfo.currencyFormatNegative = "(HK${0})";
				break;

			case 'zh-tw':
				cultureInfo.currencyRegex = new RegExp('^(NT\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-(NT\\$)?(?:\\s)*' + currencyNumberText + '$', 'i');
				cultureInfo.currencyFormat = "NT${0}";
				cultureInfo.currencyFormatNegative = "-NT${0}";
				break;

			case 'el':
			case 'el-gr':
			case 'fr-mc':
			case 'sv-fi':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(\u20AC)?$', 'i');
				cultureInfo.currencyRegexNegative = new RegExp('^-()' + currencyNumberText + '(?:\\s)*(\u20AC)?$', 'i');
				cultureInfo.currencyFormat = "{0} \\u20AC";
				cultureInfo.currencyFormatNegative = "-{0} \\u20AC";
				break;
			case 'ob-hy':
				cultureInfo.currencyRegex = new RegExp('^()' + currencyNumberText + '(?:\\s)*(\\$)?$');
				cultureInfo.currencyRegexNegative = new RegExp('^()\\(' + currencyNumberText + '(?:\\s)*(\\$)?\\)$');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^()-' + currencyNumberText + '(?:\\s)*(\\$)?$');
				cultureInfo.currencyFormat = "{0} #";
				cultureInfo.currencyFormatNegative = "({0} #)";
				break;
				//en-us, es-us
			default:
				cultureInfo.currencyRegex = new RegExp('^(\\$)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyRegexNegative = new RegExp('^\\((\\$)?(?:\\s)*' + currencyNumberText + '\\)$');
				cultureInfo.currencyRegexNegativeAlt = new RegExp('^-(\\$)?(?:\\s)*' + currencyNumberText + '$');
				cultureInfo.currencyFormat = "${0}";
				cultureInfo.currencyFormatNegative = "(${0})";
				break;
		}

		// Determine date strings
		switch (cultureName)
		{
			case 'ar-ae':
			case 'ar-bh':
			case 'ar-dz':
			case 'ar-eg':
			case 'ar-iq':
			case 'ar-jo':
			case 'ar-kw':
			case 'ar-lb':
			case 'ar-ly':
			case 'ar-ma':
			case 'ar-om':
			case 'ar-qa':
			case 'ar-sa':
			case 'ar-sy':
			case 'ar-tn':
			case 'ar-ye':
			case 'bs':
			case 'bs-ba':
			case 'bs-latn-ba':
			case 'cs':
			case 'cs-cz':
			case 'da':
			case 'da-dk':
			case 'de':
			case 'de-at':
			case 'de-ch':
			case 'de-de':
			case 'de-li':
			case 'de-lu':
			case 'el':
			case 'el-gr':
			case 'en-cb':
			case 'en-029':
			case 'en-au':
			case 'en-bz':
			case 'en-gb':
			case 'en-ie':
			case 'en-in':
			case 'en-jm':
			case 'en-my':
			case 'en-nz':
			case 'en-ph':
			case 'en-sg':
			case 'en-tt':
			case 'en-zw':
			case 'es':
			case 'es-ar':
			case 'es-bo':
			case 'es-cl':
			case 'es-co':
			case 'es-cr':
			case 'es-do':
			case 'es-ec':
			case 'es-es':
			case 'es-gt':
			case 'es-hn':
			case 'es-mx':
			case 'es-ni':
			case 'es-pe':
			case 'es-py':
			case 'es-sv':
			case 'es-uy':
			case 'es-ve':
			case 'fi':
			case 'fi-fi':
			case 'fr':
			case 'fr-fr':
			case 'fr-be':
			case 'fr-ch':
			case 'fr-lu':
			case 'fr-mc':
			case 'hr':
			case 'hr-hr':
			case 'id':
			case 'id-id':
			case 'it':
			case 'it-ch':
			case 'it-it':
			case 'ms':
			case 'ms-bn':
			case 'ms-my':
			case 'nb-no':
			case 'nl':
			case 'nl-be':
			case 'nl-nl':
			case 'nn-no':
			case 'no':
			case 'pl':
			case 'pl-pl':
			case 'pt':
			case 'pt-br':
			case 'pt-pt':
			case 'ro':
			case 'ro-ro':
			case 'ru':
			case 'ru-ru':
			case 'sk':
			case 'sk-sk':
			case 'sl':
			case 'sl-sl':
			case 'sl-si':
			case 'sr':
			case 'sr-rs':
            case 'sr-cyrl-rs':
            case 'sv-fi':
			case 'th':
			case 'th-th':
			case 'tr':
            case 'tr-tr':
            case 'vi':
            case 'vi-vn':
			case 'zh-hk':
			case 'zh-mo':
			case 'zh-sg':
				cultureInfo.dateOrder = 'dmy';
				break;

			case 'en-ca':
			case 'en-za':
            case 'fr-ca':
            case 'hu':
            case 'hu-hu':
			case 'ja':
			case 'ja-jp':
			case 'ko':
			case 'ko-kr':
			case 'sv':
			case 'sv-se':
			case 'zh-cn':
			case 'zh-tw':
			case 'ob-hy':
				cultureInfo.dateOrder = 'ymd';
				break;

				//en-us, es-pa, es-pr, es-us
			default:
				cultureInfo.dateOrder = 'mdy';
				break;
		}

		// Determine the generic date validation string
	    switch (cultureName)
        {
			case 'bs':
			case 'bs-ba':
			case 'bs-latn-ba':
			case 'hr':
			case 'hr-hr':
            case 'hu':
			case 'hu-hu':
            case 'sr':
            case 'sr-rs':
            case 'sr-cyrl-rs':
	            cultureInfo.dateText = '(\\d+)(-|/|\\.[\u00A0\u0020]?)(\\d+)\\2(\\d+)\\.[\u00A0\u0020]?';
	            break;

	        default:
	            cultureInfo.dateText = '(\\d+)(-|/|\\.[\u00A0\u0020]?)(\\d+)\\2(\\d+)';
	            break;
        }

		switch (cultureName)
		{
			case 'ar-dz':
			case 'ar-ma':
			case 'ar-tn':
			case 'da':
			case 'da-dk':
			case 'en-ca':
			case 'en-in':
			case 'es-cl':
			case 'fr-be':
			case 'fr-ca':
			case 'ko':
			case 'ko-kr':
			case 'nl':
			case 'nl-nl':
			case 'sv':
			case 'sv-fi':
			case 'sv-se':
				cultureInfo.dateSeparator = '-';
				break;

			case 'cs':
			case 'cs-cz':
			case 'de':
			case 'de-de':
			case 'de-at':
			case 'de-li':
			case 'de-ch':
			case 'de-lu':
			case 'fi':
			case 'fi-fi':
			case 'fr-ch':
			case 'hr':
			case 'hr-hr':
			case 'it-ch':
			case 'nn-no':
			case 'nb-no':
			case 'no':
			case 'pl':
			case 'pl-pl':
			case 'ro':
			case 'ro-ro':
			case 'ru':
			case 'ru-ru':
			case 'sr':
			case 'sr-rs':
            case 'sr-cyrl-rs':
            case 'tr':
			case 'tr-tr':
				cultureInfo.dateSeparator = '.';
				break;

			case 'bs':
			case 'bs-ba':
			case 'bs-latn-ba':
            case 'hu':
			case 'hu-hu':
			case 'sk':
			case 'sk-sk':
			case 'sl':
			case 'sl-sl':
			case 'sl-si':
				cultureInfo.dateSeparator = '. ';
				break;

				//ar-ae, ar-bh, ar-eg, ar-iq, ar-jo, ar-kw, ar-lb, ar-ly, ar-om, ar-qa, ar-sa, ar-sy, ar-ye,
				//el, el-gr, en-au, en-bz, en-cb, en-029, en-gb, en-ie, en-jm, en-my, en-nz, en-ph,
				//en-sg, en-tt, en-us, en-za, en-zw, es, es-ar, es-bo, es-co, es-cr, es-do, es-ec, es-es,
				//es-gt, es-hn, es-mx, es-ni, es-pa, es-pe, es-pr, es-py, es-sv, es-uy, es-us, es-ve, fr, fr-fr,
				//fr-lu, fr-mc, id, id-id, it, it-it, ja, ja-jp, ms, ms-my, ms-bn, nl-be, pt, pt-br, pt-pt, th, th-th, vi, vi-vn, zh-cn, zh-hk, zh-mo, zh-sg, zh-tw
			default:
				cultureInfo.dateSeparator = '/';
				break;
		}

		// Determine the year offset
		switch (cultureName)
		{
			case "th":
			case "th-th":
				cultureInfo.yearOffset = 543;
				break;
			default:
				cultureInfo.yearOffset = 0;
				break;
		}

		// Determine date format
		var dayCharacter = "d";
		var monthCharacter = "M";
		var yearCharacter = "y";
		switch (cultureName)
		{
			case 'da':
			case 'da-dk':
			case 'nn-no':
			case 'nb-no':
			case 'sv':
			case 'sv-se':
			case 'sv-fi':
				dayCharacter = "D";
				monthCharacter = "M";
				yearCharacter = CharCode.CapitalAWithRingAbove;
				break;

			case 'de':
			case 'de-de':
				dayCharacter = "T";
				monthCharacter = "M";
				yearCharacter = "J";
				break;

			case 'nl':
			case 'nl-nl':
				dayCharacter = "D";
				monthCharacter = "M";
				yearCharacter = "J";
				break;

			case 'es-mx':
			case 'pt-br':
				dayCharacter = "D";
				monthCharacter = "M";
				yearCharacter = "A";
				break;

			case 'fr':
			case 'fr-fr':
				dayCharacter = "J";
				monthCharacter = "M";
				yearCharacter = "A";
				break;

			case 'it':
			case 'it-it':
				dayCharacter = "G";
				monthCharacter = "M";
				yearCharacter = "A";
				break;

			case 'tr':
			case 'tr-tr':
				dayCharacter = "G";
				monthCharacter = "A";
				yearCharacter = "Y";
				break;

			case 'zh-hk':
				dayCharacter = CharCode.ChineseDay;
				monthCharacter = CharCode.ChineseMonth;
				yearCharacter = CharCode.ChineseYear;
				break;

			default:
				break;
		}

		var monthPlaceholder;
		var dayPlaceholder;
		var yearPlaceholder;
		if (cultureName === 'zh-hk')
		{
			//Don't repeat placeholders in chinese
			monthPlaceholder = monthCharacter;
			dayPlaceholder = dayCharacter;
			yearPlaceholder = yearCharacter;
		}
		else if (cultureName === 'ar-sa')
		{
			monthPlaceholder = monthCharacter + monthCharacter;
			dayPlaceholder = dayCharacter + dayCharacter;
			yearPlaceholder = yearCharacter + yearCharacter;
		}
		else
		{
			monthPlaceholder = monthCharacter + monthCharacter;
			dayPlaceholder = dayCharacter + dayCharacter;
			yearPlaceholder = yearCharacter + yearCharacter + yearCharacter + yearCharacter;
		}

		if (cultureName === 'ar-sa')
		{
			//format 'dmy' (RTL): yy-MM-dd
			cultureInfo.dateFormat = yearPlaceholder + cultureInfo.dateSeparator + monthPlaceholder + cultureInfo.dateSeparator + dayPlaceholder;
		}
		else
		{
			switch (cultureInfo.dateOrder)
			{
				case 'dmy':
					if (cultureName === "bs" || cultureName === "bs-ba" || cultureName === "bs-latn-ba" ||
						cultureName === "hr" || cultureName === "hr-hr" ||
						cultureName === "sr" || cultureName === "sr-rs" || cultureName === "sr-cyrl-rs")
					{
						// dd.mm.yyyy. || dd. mm. yyyy. 
                        cultureInfo.dateFormat = dayPlaceholder +
                            cultureInfo.dateSeparator +
                            monthPlaceholder +
                            cultureInfo.dateSeparator +
							yearPlaceholder +
                            cultureInfo.dateSeparator;
					}
					else
					{
						// dd-MM-yyyy
                        cultureInfo.dateFormat = dayPlaceholder +
                            cultureInfo.dateSeparator +
                            monthPlaceholder +
                            cultureInfo.dateSeparator +
                            yearPlaceholder;
                    }
					break;
				case 'ymd':
                    if (cultureName === "hu" || cultureName === "hu-hu")
					{
						// yyyy. MM. dd.
                        cultureInfo.dateFormat = yearPlaceholder + cultureInfo.dateSeparator + monthPlaceholder + cultureInfo.dateSeparator + dayPlaceholder + cultureInfo.dateSeparator;
                    }
                    else
					{
						// yyyy-MM-dd
                        cultureInfo.dateFormat = yearPlaceholder + cultureInfo.dateSeparator + monthPlaceholder + cultureInfo.dateSeparator + dayPlaceholder;
                    }
                    break;
				case 'mdy':
					/* falls through */
				default:
					//MM-dd-yyyy
					cultureInfo.dateFormat = monthPlaceholder + cultureInfo.dateSeparator + dayPlaceholder + cultureInfo.dateSeparator + yearPlaceholder;
					break;
			}
		}

		// Determine time format
		switch (cultureName)
		{
			case 'ar-dz':
			case 'ar-ma':
			case 'ar-tn':
			case 'bs':
			case 'bs-ba':
			case 'bs-latn-ba':
			case 'cs':
			case 'cs-cz':
			case 'da':
			case 'da-dk':
			case 'de':
			case 'de-at':
			case 'de-ch':
			case 'de-de':
			case 'de-li':
			case 'de-lu':
			case 'en-029':
			case 'en-bz':
			case 'en-cb':
			case 'en-gb':
			case 'en-ie':
			case 'en-in':
			case 'en-za':
			case 'en-zw':
			case 'es':
			case 'es-ar':
			case 'es-bo':
			case 'es-cl':
			case 'es-cr':
			case 'es-ec':
			case 'es-es':
			case 'es-gt':
			case 'es-hn':
			case 'es-ni':
			case 'es-pe':
			case 'es-py':
			case 'es-sv':
			case 'es-uy':
			case 'fr':
			case 'fr-be':
			case 'fr-ca':
			case 'fr-ch':
			case 'fr-fr':
			case 'fr-lu':
			case 'fr-mc':
			case 'hr':
			case 'hr-hr':
			case 'hu':
			case 'hu-hu':
			case 'it':
			case 'it-ch':
			case 'it-it':
			case 'ja':
			case 'ja-jp':
			case 'nb-no':
			case 'no':
			case 'nl':
			case 'nl-be':
			case 'nl-nl':
			case 'nn-no':
			case 'pl':
			case 'pl-pl':
			case 'pt':
			case 'pt-br':
			case 'pt-pt':
			case 'ro':
			case 'ro-ro':
			case 'ru':
			case 'ru-ru':
			case 'sk':
			case 'sk-sk':
			case 'sl':
			case 'sl-sl':
			case 'sl-si':
			case 'sr':
            case 'sr-rs':
			case 'sr-cyrl-rs':
            case 'sv':
			case 'sv-se':
			case 'sv-fi':
			case 'th':
			case 'th-th':
			case 'tr':
			case 'tr-tr':
			case 'zh-cn':
			case 'zh-hk':
			case 'zh-mo':
			case 'ob-hy':
				//24-hour
				cultureInfo.timeText = '(\\d\\d?)\\:(\\d\\d)(?:\\:(\\d\\d))?';
				cultureInfo.timeConvention = 24;
				cultureInfo.timeSeparator = ':';
				cultureInfo.hasTimeSymbolPrefix = false;
				cultureInfo.amText = "AM";
				cultureInfo.pmText = "PM";
				break;

			case 'fi':
			case 'fi-fi':
			case 'id':
			case 'id-id':
				//24-hour with a dot as the delimiter
				cultureInfo.timeText = '(\\d\\d?)\\.(\\d\\d)(?:\\.(\\d\\d))?';
				cultureInfo.timeConvention = 24;
				cultureInfo.timeSeparator = '.';
				cultureInfo.hasTimeSymbolPrefix = false;
				cultureInfo.amText = "AM";
				cultureInfo.pmText = "PM";
				break;

			case 'ko':
			case 'ko-kr':
				//tt h:mm:ss
				cultureInfo.timeText = '(\\uC624[\\uC804\\uD6C4]|[aApP]\\.?[mM]\\.?) *(\\d\\d?)\\:(\\d\\d)(?:\\:(\\d\\d))?';
				cultureInfo.timeConvention = 12;
				cultureInfo.timeSeparator = ':';
				cultureInfo.hasTimeSymbolPrefix = true;
				cultureInfo.amText = "\uC624\uC804";
				cultureInfo.pmText = "\uC624\uD6C4";
				break;

			case 'zh-sg':
				//tt hh:mm:ss
				cultureInfo.timeText = '(a|p|A|P)\\.?(?:m|M)\\.? *(\\d\\d?)\\:(\\d\\d)(?:\\:(\\d\\d))?';
				cultureInfo.timeConvention = 12;
				cultureInfo.timeSeparator = ':';
				cultureInfo.hasTimeSymbolPrefix = true;
				cultureInfo.amText = "AM";
				cultureInfo.pmText = "PM";
				break;

			case 'zh-tw':
				//tt hh:mm:ss
				cultureInfo.timeText = '([\\u4E0A\\u4E0B](?:\\u5348)\\.?|[apAP]\\.?[mM]\\.?) *(\\d\\d?)\\:(\\d\\d)(?:\\:(\\d\\d))?';
				cultureInfo.timeConvention = 12;
				cultureInfo.timeSeparator = ':';
				cultureInfo.hasTimeSymbolPrefix = true;
				cultureInfo.amText = "\u4E0A\u5348";
				cultureInfo.pmText = "\u4E0B\u5348";
				break;


			case 'el':
			case 'el-gr':
				// h:mm:ss tt
				// unicode 03BC= mu, 03A0=Pi
				cultureInfo.timeText = '(\\d\\d?)\\:(\\d\\d)(?:\\:(\\d\\d))? *(((\\u03BC|\\u03A0)\\.?\\u03BC\\.?)|(A\\.?M\\.?)|(P\\.?M\\.?)?)';
				cultureInfo.timeConvention = 12;
				cultureInfo.timeSeparator = ':';
				cultureInfo.hasTimeSymbolPrefix = false;
				cultureInfo.amText = "\u03A0\u03BC";
				cultureInfo.pmText = "\u03BC\u03BC";
                break;

            case 'vi':
            case 'vi-vn':
                //12-hour
                cultureInfo.timeText = '(\\d\\d?)\\:(\\d\\d)(?:\\:(\\d\\d))? *(([Ss]\\.?\\s?[Aa]\\.?)|([Cc]\\.?\\s?[Hh]\\.?))';
                cultureInfo.timeConvention = 12;
                cultureInfo.timeSeparator = ':';
                cultureInfo.hasTimeSymbolPrefix = false;
                cultureInfo.amText = "SA";
                cultureInfo.pmText = "CH";
                break;

				//ar-ae, ar-bh, ar-eg, ar-iq, ar-jo, ar-kw, ar-lb, ar-ly, ar-om, ar-qa, ar-sa, ar-sy,
				//ar-ye, en-au, en-ca, en-jm, en-my, en-nz, en-ph, en-sg, en-tt, en-us,
				//es-co, es-do, es-mx, es-pa, es-pr, es-us, es-ve, ms, ms-bn, ms-my
			default:
				//12-hour
				cultureInfo.timeText = '(\\d\\d?)\\:(\\d\\d)(?:\\:(\\d\\d))? *(a|p|A|P)\\.?\\s?(?:m|M)\\.?';
				cultureInfo.timeConvention = 12;
				cultureInfo.timeSeparator = ':';
				cultureInfo.hasTimeSymbolPrefix = false;
				cultureInfo.amText = "AM";
				cultureInfo.pmText = "PM";
				break;
		}

		var timeFormat = cultureInfo.timeSeparator + 'mm' + cultureInfo.timeSeparator + 'ss';
		switch (cultureInfo.timeConvention)
		{
			case 12:
				timeFormat = ' hh' + timeFormat;
				if (cultureInfo.hasTimeSymbolPrefix)
				{
					timeFormat = ' tt' + timeFormat;
				}
				else
				{
					timeFormat += ' tt';
				}
				break;
			case 24:
				/* falls through */
			default:
				timeFormat = ' HH' + timeFormat;
				break;
		}
		cultureInfo.dateTimeFormat = cultureInfo.dateFormat + timeFormat;

		// Single byte rules :
		// If not a CJK user, all characters considered single byte.
		// For a CJK user, characters identified as single byte are selected from the 'Basic Latin', 'Latin-1 Supplement', and 'Halfwidth and Fullwidth Forms' blocks.
		// Each language in the CJK group has their own match since a character may be one byte in one code page but two in another.
		// Everything else is considered double byte for the CJK user.
		// Code pages used : Japanese = 932, Chinese = 936, Korean = 949.
		switch (cultureName)
		{
			case 'ja':
			case 'ja-jp':
				cultureInfo.singleByteMatch = /^[\u0000-\u00A1\u00A4-\u00A6\u00A9-\u00AA\u00AD-\u00AE\u00B2-\u00B3\u00B9-\u00BA\u00BC-\u00D6\u00D8-\u00F6\u00F8-\u00FF\uFF5F-\uFFDF\uFFE6-\uFFFF]$/;
				break;
			case "zh-cn":
			case "zh-sg":
			case "zh-hk":
			case "zh-mo":
			case "zh-tw":
				cultureInfo.singleByteMatch = /^[\u0000-\u00A1\u00A6\u00A9-\u00AE\u00B2-\u00B3\u00B6\u00B8-\u00BF\u00C2-\u00C7\u00CB\u00CE-\u00D1\u00D4-\u00D6\u00D8\u00DB\u00DD-\u00DF\u00E2-\u00E7\u00EB\u00EE-\u00F1\u00F4-\u00F6\u00F8\u00FB\u00FD-\u00FF\uFF5F-\uFFDF\uFFE6-\uFFFF]$/;
				break;
			case 'ko':
			case 'ko-kr':
				cultureInfo.singleByteMatch = /^[\u0000-\u00A0\u00A6\u00AF\u00C0-\u00C5\u00C7-\u00CF\u00D1-\u00D6\u00D9-\u00DD\u00E0-\u00E5\u00E7-\u00EF\u00F1-\u00F6\u00F9-\u00FD\u00FF\uFF5F-\uFF9F\uFFBF-\uFFC1\uFFC8-\uFFC9\uFFD0-\uFFD1\uFFD8-\uFFD9\uFFDD-\uFFDF\uFFE4\uFFE7-\uFFFF]$/;
				break;
			default:
				cultureInfo.singleByteMatch = /^[\u0000-\uFFFF]$/;
				break;
		}

		return cultureInfo;
	}

	// Get the user's current culture
	function getUsersCulture()
	{
		var language;

		if ($OB)
		{
			language = $OB.clientConfig.cultureCode;
		}
		else if (typeof (globalVariables) !== "undefined" && globalVariables.formatCulture)
		{
			// Alternative structure to set the culture for formatting.
			language = globalVariables.formatCulture.toLowerCase();
		}
		else if (window.sessionStorage)
		{
			language = window.sessionStorage.getItem("__UsersCultureCode");
		}
		else if (navigator.userLanguage)
		{
			language = navigator.userLanguage;
        }
        else if (navigator.languages)
        {
            language = navigator.languages[0].toLowerCase();
        }

		return language || "en-us";
	}

	// Converts parsed data to a culture-specific format
	function localize(cultureInfo, parsedData, dataType, bFormattedCurrency, mask, staticCharacters)
	{
		var localizedData = null;

		switch (dataType)
		{
			case DataType.WorkviewBoolean:
				localizedData = localizeWorkviewBoolean(parsedData);
				break;

			case DataType.AlphaNumeric:
			case DataType.AlphaNumericSingleTable:
			case DataType.AlphaNumericCSInsensitiveSearch:
			case DataType.AlphaNumericSingleTableCSInsensitiveSearch:
				localizedData = localizeAlphaNumeric(parsedData);
				break;

			case DataType.LargeNumeric:
			case DataType.SmallNumeric:
				localizedData = localizeNumeric(parsedData, mask, staticCharacters);
				break;

			case DataType.Currency:
			case DataType.SpecificCurrency:
				localizedData = localizeCurrency(cultureInfo, parsedData, bFormattedCurrency);
				break;

			case DataType.Float:
				localizedData = localizeFloat(cultureInfo, parsedData);
				break;

			case DataType.Date:
			case DataType.DateTime:
				localizedData = localizeDate(cultureInfo, parsedData, dataType);
				break;

			default:
				// Invalid data type
				break;
		}

		return localizedData;
	}

	// Returns the parsed Workview boolean
	function localizeWorkviewBoolean(parsedWorkviewBoolean)
	{
		return parsedWorkviewBoolean.string;
	}

	// Returns the parsed string
	function localizeAlphaNumeric(parsedAlphaNumeric)
	{
		return parsedAlphaNumeric.string;
	}

	// Returns the parsed numeric, applying a mask if necessary
	function localizeNumeric(parsedNumeric, mask, staticCharacters)
	{
		var localizedNumeric = null;

		//Return number (leading 0's have been stripped)
		if (parsedNumeric.isNegative)
		{
			localizedNumeric = '-' + parsedNumeric.integerPart;
		}
		else
		{
			localizedNumeric = parsedNumeric.integerPart;
		}

		//If there's no mask to apply, just return the output
		if (mask.length > 0)
		{
			localizedNumeric = maskAlphaNumeric(localizedNumeric, mask, staticCharacters);
		}

		return localizedNumeric;
	}

	// Converts parsed currency to a culture-specific format
	function localizeCurrency(cultureInfo, parsedCurrency, bFormattedCurrency)
	{
		var localizedCurrency = null;

		// currency (2 decimal places)
		// don't display a currency symbol
		var strOutput = "";

		// for Formatted Currecny values, we don't want to add group separators
		// because they may cause problems in the Core.
		var strWholePart = bFormattedCurrency ? parsedCurrency.integerPart : validateAddGroups(parsedCurrency.integerPart, cultureInfo.digitGroupSeparator);
		strOutput += strWholePart;

		// When we localize from a locale which defines a decimal to one which does not; we must make sure that we do not
		// lose the decimal value. An example of this would be when going from English to Win2k Italian.
		var bKeepDecimalValue = false;
		if (!cultureInfo.currencyHasDecimalPart && parsedCurrency.decimalPart.length > 0 && parsedCurrency.decimalPart !== "0")
		{
			bKeepDecimalValue = true;
		}

		// append decimal part
		if (cultureInfo.currencyHasDecimalPart || bKeepDecimalValue)
		{
			strOutput += cultureInfo.currencyDecimalSeparator + parsedCurrency.decimalPart;

			if (parsedCurrency.decimalPart.length < 2)
			{
				strOutput += "0";
			}

			if (parsedCurrency.decimalPart.length < 1)
			{
				strOutput += "0";
			}
		}
		else
		{
			parsedCurrency.decimalPart = "";
		}

		// add currency symbol
		if (parsedCurrency.isNegative)
		{
			strOutput = cultureInfo.currencyFormatNegative.replace("{0}", strOutput);
		}
		else
		{
			strOutput = cultureInfo.currencyFormat.replace("{0}", strOutput);
		}

		localizedCurrency = strOutput;
		localizedCurrency.negative = parsedCurrency.isNegative;
		localizedCurrency.integer = parsedCurrency.integerPart;
		localizedCurrency.decimal = parsedCurrency.decimalPart;

		return localizedCurrency;
	}

	// Converts parsed float to a culture-specific format
	function localizeFloat(cultureInfo, parsedFloat)
	{
		var localizedFloat = "";
		if (parsedFloat.isNegative)
		{
			localizedFloat = localizedFloat + '-';
		}

		localizedFloat = localizedFloat + parsedFloat.integerPart;

		if (parsedFloat.decimalPart.length > 0)
		{
			localizedFloat = localizedFloat + cultureInfo.decimalSeparator + parsedFloat.decimalPart;
		}

		return localizedFloat;
	}

	// Converts parsed date to a culture-specific format
	function localizeDate(cultureInfo, parsedDate, dataType)
	{
		var localizedDate = "";

		//Get Arabic Date from the server
		if (isArabicLocale())
		{
			localizedDate = dataType === DataType.Date ? parsedDate["LocaleDate"] : parsedDate["LocaleDateTime"];
		}
		else
		{
			parsedDate.year += cultureInfo.yearOffset;

			//Generate date strings
			var monthString = parsedDate.month.toString();
			var dayString = parsedDate.day.toString();
			var yearString = parsedDate.year.toString();
			if (monthString.length === 1)
			{
				monthString = '0' + monthString;
			}
			if (dayString.length === 1)
			{
				dayString = '0' + dayString;
			}
			switch (cultureInfo.dateOrder)
			{
				case 'dmy':
                    if (cultureInfo.dateFormat === "dd.MM.yyyy." || cultureInfo.dateFormat === "dd. MM. yyyy. ") {
                        localizedDate = dayString +
                            cultureInfo.dateSeparator +
                            monthString +
                            cultureInfo.dateSeparator +
                            yearString +
                            cultureInfo.dateSeparator;
                    }
                    else {
                        localizedDate = dayString +
                            cultureInfo.dateSeparator +
                            monthString +
                            cultureInfo.dateSeparator +
                            yearString;
                    }
                    break;
				case 'ymd':
                    if (cultureInfo.dateFormat === "yyyy. MM. dd. ")
                    {
                        localizedDate = yearString + cultureInfo.dateSeparator + monthString + cultureInfo.dateSeparator + dayString + cultureInfo.dateSeparator;
                    }
                    else
                    {
                        localizedDate = yearString + cultureInfo.dateSeparator + monthString + cultureInfo.dateSeparator + dayString;
                    }
                    break;
				case 'mdy':
					/* falls through */
				default:
					localizedDate = monthString + cultureInfo.dateSeparator + dayString + cultureInfo.dateSeparator + yearString;
					break;
			}

			if (dataType === DataType.DateTime)
			{
				localizedDate = localizedDate + ' ';

				//DateTime
				var adjustedHours = parsedDate.hours;
				var ampm = cultureInfo.amText;

				if (cultureInfo.timeConvention === 12)
				{
					if (adjustedHours > 11)
					{
						adjustedHours = adjustedHours - 12;
						ampm = cultureInfo.pmText;
					}
					if (adjustedHours === 0)
					{
						adjustedHours = 12;
					}
				}

				if (cultureInfo.hasTimeSymbolPrefix && cultureInfo.timeConvention === 12)
				{
					localizedDate += ampm + ' ';
				}

				if (adjustedHours < 10)
				{
					localizedDate = localizedDate + '0';
				}

				localizedDate = localizedDate + adjustedHours.toString() + cultureInfo.timeSeparator;

				if (parsedDate.minutes < 10)
				{
					localizedDate = localizedDate + '0';
				}

				localizedDate = localizedDate + parsedDate.minutes.toString() + cultureInfo.timeSeparator;

				if (parsedDate.seconds < 10)
				{
					localizedDate = localizedDate + '0';
				}

				localizedDate = localizedDate + parsedDate.seconds.toString();

				if (!cultureInfo.hasTimeSymbolPrefix && cultureInfo.timeConvention === 12)
				{
					localizedDate = localizedDate + ' ' + ampm;
				}
			}
		}

		return localizedDate;
	}

	function parseFloat(cultureInfo, data)
	{
		/// <summary>
		/// Parses a float based on the specified culture
		/// </summary>
		/// <param name="cultureInfo"></param>
		/// <param name="data"></param>
		/// <returns type=""></returns>

		var parsedFloat = null;

		// initialize error reason indicators
		Error.FloatPrecision = false;
		Error.MaxLength = false;
		Error.NonNumeric = false;
		Error.OutsideRange = false;

		if (data.length > MAX_FLOAT_CHARACTERS)
		{
			Error.MaxLength = true;
		}
		else
		{
			var result = cultureInfo.floatRegex.exec(data);
			if (result === null)
			{
				Error.NonNumeric = true;
			}
			else
			{
				var isNegative = typeof result[1] !== 'undefined' && result[1].length > 0;
				var integerPart = null;
				var decimalPart = null;

				//Ensure at least one zero
				if (typeof result[3] !== 'undefined' && result[3].length > 0)
				{
					integerPart = stripLeadingZeros('0' + result[2].toString());
					decimalPart = stripTrailingZeros(result[3]);
					if (decimalPart.length > FLOAT_MAX_PRECISION)
					{
						Error.FloatPrecision = true;
					}
				}
				else
				{
					integerPart = stripLeadingZeros(result[4]);
					decimalPart = "0";
				}

				if (!Error.FloatPrecision)
				{
					if (window.parseFloat(integerPart + "." + decimalPart) >= FLOAT_MAX_SIZE)
					{
						Error.OutsideRange = true;
					}
					else
					{
						parsedFloat = {
							isNegative: isNegative,
							integerPart: integerPart,
							decimalPart: decimalPart
						};
					}
				}
			}
		}

		return parsedFloat;
	}

	// Parses culture-specific data
	// null is returned for invalid data
	// Statics should look like this: "---" not "   -   -    "
	// Even if full is true, empty strings are accepted
	// here and the user should check for empty strings if they're invalid
	function parseData(cultureInfo, data, dataType, dataLength, mask, staticCharacters, full, allowNewLine)
    {
		var parsedData = null;
		switch (dataType)
		{
			case DataType.WorkviewBoolean:
				parsedData = parseWorkviewBoolean(data);
				break;

			case DataType.AlphaNumeric:
			case DataType.AlphaNumericSingleTable:
			case DataType.AlphaNumericCSInsensitiveSearch:
            case DataType.AlphaNumericSingleTableCSInsensitiveSearch:
				parsedData = parseAlphaNumeric(cultureInfo, data, dataLength, mask, staticCharacters, full, allowNewLine);
				break;

			case DataType.LargeNumeric:
            case DataType.SmallNumeric:
				parsedData = parseNumeric(cultureInfo, data, dataType, mask, staticCharacters, full);
				break;

			case DataType.Currency:
			case DataType.SpecificCurrency:
				parsedData = parseCurrency(cultureInfo, data);
				break;

			case DataType.Float:
				parsedData = parseFloat(cultureInfo, data);
				break;

			case DataType.Date:
				parsedData = parseDate(cultureInfo, data);
				break;

			case DataType.DateTime:
				parsedData = parseDateTime(cultureInfo, data);
				break;

			default:
				// Invalid data type
				break;
		}

		return parsedData;
	}

	// Parses a Workview boolean
	function parseWorkviewBoolean(data)
	{
		var parsedWorkviewBoolean = null;
		if (data === 'TRUE' || data === 'FALSE')
		{
			parsedWorkviewBoolean = { string: data };
		}
		return parsedWorkviewBoolean;
	}

	// Parses an alphanumeric based on the specified culture
	function parseAlphaNumeric(cultureInfo, data, dataLength, mask, staticCharacters, full, allowNewLine)
    {
		var parsedAlphaNumeric = null;

		//There could be a mask here. If there is, we must remove any padding
		//that the core inserted after the actual mask value.
		var maskLength = mask.length;
		if (maskLength !== 0)
		{
			data = removeMaskPadding(data, mask, staticCharacters, full);
		}

		if (_public.getStringByteLength(data, null, cultureInfo) > dataLength)
		{
			return null;
		}

		// Determine if new lines are allowed
		var validNewLine = true;
		if (allowNewLine)
		{
			//Don't allow newlines in alphanumeric fields
			var newLineRegex = /\n/;
			validNewLine = !newLineRegex.test(data);
		}

		//Validate mask
		var validMask = false;
		if (maskLength === 0)
		{
			validMask = true;
		}
		else
		{
			validMask = validateMask(data, mask, staticCharacters, full);
		}

		if (validNewLine && validMask)
		{
			parsedAlphaNumeric = { string: data };
		}

		return parsedAlphaNumeric;
	}

	// Parses a numeric based on the specified culture
	function parseNumeric(cultureInfo, data, dataType, mask, staticCharacters, full)
    {
		var parsedNumeric = null;

		staticCharacters = staticCharacters || null;

		//There could be a mask here. If there is, we must remove any padding
		//that the core inserted after the actual mask value.
        var maskLength = mask.length;
		if (maskLength !== 0)
		{
			data = removeMaskPadding(data, mask, staticCharacters, full);
		}

		//Validate and strip out mask if present.
		var validMask = false;
		if (maskLength === 0)
        {
			validMask = true;
		}
		else
		{
			validMask = validateMask(data, mask, staticCharacters, full);
			if (validMask)
			{
				data = unMaskAlphaNumeric(data, mask);
			}
		}

		// Validate length based on data type
		var validLength = false;
		if (dataType === DataType.SmallNumeric)
		{
			validLength = data.length <= SMALLNUMERIC_MAX_LENGTH;
		}
		else
		{
			validLength = data.length <= LARGENUMERIC_MAX_LENGTH;
		}

        var result = cultureInfo.numericRegex.exec(data);

		if (result !== null && validMask && validLength)
		{
			var isNegative = (result[1] != null && result[1].length > 0);   // jshint ignore:line
            var integerPart = stripLeadingZeros(result[2]);

			//We can't allow the user to enter a leading zero in a masked w static numeric keyword
			//because it could misalign the mask when it's stripped. See if stripleadingzeros
			//did anything.
            var invalidStatic = (staticCharacters !== null && staticCharacters.length > 0 && result[2].length !== integerPart.length);

			if (!invalidStatic)
			{
				parsedNumeric = {
					isNegative: isNegative,
					integerPart: integerPart
				};
			}
		}

		return parsedNumeric;
	}

	// Parses a currency based on the specified culture
	function parseCurrency(cultureInfo, data)
    {
		var parsedCurrency = null;

		//Try positive currency format
		var isNegative = false;
		var result = cultureInfo.currencyRegex.exec(data);
		if (result !== null)
		{
			isNegative = false;
		}
		else
		{
			//Try negative currency format
			result = cultureInfo.currencyRegexNegative.exec(data);

			//Does locale require "()" for negative currency but user has entered "-"
			if (result === null && cultureInfo.currencyRegexNegativeAlt !== null && cultureInfo.currencyRegexNegativeAlt !== "")
			{
				result = cultureInfo.currencyRegexNegativeAlt.exec(data);
			}

			if (result !== null)
			{
				isNegative = true;
			}
		}

		// Separate the input value into its integer and decimal values
		var intIntegerLocation = 2;
		var intDecimalLocation = 5;

		if (result !== null)
		{
			var strippedIntegerAmount = "0";

			if (result[intIntegerLocation] != null)   // jshint ignore:line
			{
				strippedIntegerAmount = stripGroupSeparator(result[intIntegerLocation], cultureInfo.digitGroupSeparatorRegex);
			}

			if ((isNegative && strippedIntegerAmount.length > 16) || (!isNegative && strippedIntegerAmount.length > 17))
			{
				parsedCurrency = null;
			}
			else if (typeof result[intDecimalLocation] !== 'undefined' && result[intDecimalLocation].length > 0)
			{
				//Ensure at least one zero
				parsedCurrency = {
					isNegative: isNegative,
					integerPart: stripLeadingZeros('0' + strippedIntegerAmount),
					decimalPart: stripTrailingZeros(result[intDecimalLocation])
				};
			}
				// Else no decimal amount has been specified
			else
			{
				parsedCurrency = {
					isNegative: isNegative,
					integerPart: stripLeadingZeros(strippedIntegerAmount),
					decimalPart: ""
				};
			}
		}

		return parsedCurrency;
	}

	// Parses a date based on the specified culture
	function parseDate(cultureInfo, data)
    {
		var parsedDate = null;

		// When validating, cultureInfo will be invariant culture,
		// but we must instead use LocalizedCalendar when coming from
		// an Arabic locale to handle the alternate calendar from
		// the localized date on the server.
		if (isArabicLocale())
		{
			parsedDate = validateLocaleDate(data);
		}
		else
		{
			//Try the standard format
			var dateRegEx = new RegExp('^' + cultureInfo.dateText + '$');
			var result = dateRegEx.exec(data);
			if (result !== null)
			{
				var capturedDate = captureDate(cultureInfo, result);
				if (capturedDate !== null)
				{
					parsedDate = {
						year: capturedDate.year,
						month: capturedDate.month,
						day: capturedDate.day
					};
				}
			}
		}

		return parsedDate;
	}

	// Parses a date time based on the specified culture
	function parseDateTime(cultureInfo, data)
	{
		var parsedDateTime = null;
		if (isArabicLocale())
		{
			parsedDateTime = validateLocaleDate(data);
		}
		else
		{
			//Try the standard date format
			var dateTimeRegEx = new RegExp('^' + cultureInfo.dateText + ' +' + cultureInfo.timeText + '$');
			var result = dateTimeRegEx.exec(data);
			if (result === null)
			{
				//This isn't reading as a date-time. Try just date.
				var parsedDate = parseDate(cultureInfo, data);
				if (parsedDate !== null)
				{
					parsedDateTime = {
						year: parsedDate.year,
						month: parsedDate.month,
						day: parsedDate.day,
						hours: 0,
						minutes: 0,
						seconds: 0
					};
				}
			}
			else
			{
				var capturedDate = captureDate(cultureInfo, result);
				// If we have a valid date, capture the time
				if (capturedDate !== null)
				{
					// Determine indexes for pieces of the time value
					var timeSymbolIndex = 8;
					var hourIndex = 5;
					if (cultureInfo.hasTimeSymbolPrefix)
					{
						timeSymbolIndex = 5;
						hourIndex++;
					}
					var minuteIndex = hourIndex + 1;
					var secondIndex = minuteIndex + 1;

					// Get hours, minutes, and seconds
					var hours = parseInt64(result[hourIndex]);
					var minutes = parseInt64(result[minuteIndex]);
					var seconds = 0;
					if (result[secondIndex])
					{
						seconds = parseInt64(result[secondIndex]);
					}

					var validHours = (cultureInfo.timeConvention !== 12) || (hours <= 12);
					if (validHours)
					{
						// Adjust hours for time format
						if (cultureInfo.timeConvention === 12)
						{
							if (hours === 12)
							{
								hours = 0;
							}

							// Check if the time symbol indicates the second half of a day (ie. PM)
							var secondHalfOfDayIndex = ['p', 'pm', '\u4E0B\u5348', '\uC624\uD6C4', 'ch']
							if ((secondHalfOfDayIndex.indexOf(result[timeSymbolIndex].toLowerCase()) != -1) ||
								(!cultureInfo.hasTimeSymbolPrefix && result[timeSymbolIndex].toLowerCase().charAt(0) === '\u03BC')) {
								hours += 12;
							}
						}

						// Verify time
						if (hours >= 0 && hours < 24
							&& minutes >= 0 && minutes < 60
							&& seconds >= 0 && seconds < 60)
						{
							parsedDateTime = {
								year: capturedDate.year,
								month: capturedDate.month,
								day: capturedDate.day,
								hours: hours,
								minutes: minutes,
								seconds: seconds
							};
						}
					}
				}
			}
		}

		return parsedDateTime;
	}

	// Remove any space padding from the end of the masked characters
	function removeMaskPadding(varDataToValidate, mask, staticCharacters, full)
	{
		var result = varDataToValidate;
		//If the value is obviously invalid as it is, quit to avoid further errors
		if (result.length > mask.length)
		{
			return varDataToValidate;
		}

		while (result.length > 0)
		{
			// if we hit a static char and we need full field entry, then we don't want to
			// take the static char off.  If we do not require full field entry, then strip
			// the static char off, as there might be white space that needs to be stripped off
			// before the static char.
			if ((mask.charAt(result.length - 1) === 'S' && !(parseInt64(full)) && staticCharacters.indexOf(result.charAt(result.length - 1)) !== -1)
				|| result.charAt(result.length - 1) === ' ')
			{
				//Take off the space or static char padding
				result = result.substr(0, result.length - 1);
			}
			else
			{
				break;
			}
		}
		return result;
	}

	// With Windows Vista and Windows 7, support has been added for many new locales.  Several of these locales
	// are for supported languages, but due to limitations with availability of the locales in .NET on the server-side,
	// we are defaulting to a known good value as a fallback for now.
	function replaceUnsupportedLocale(language)
	{
		switch (language)
		{
			case 'en-cb': 			/* English (Carribean) */
				return 'en-029';
			default:
				return language;
		}
	}

	// Strip group separators from a numeric string
	function stripGroupSeparator(inputString, separatorString)
	{
		var separatorRegex = new RegExp(separatorString, "g");
		return inputString.replace(separatorRegex, '');
	}

	// Strips leading zeros
	function stripLeadingZeros(integer)
	{
		while (integer.length > 1 && integer.charAt(0) === '0')
		{
			integer = integer.slice(1);
		}
		return integer;
	}

	// Strips trailing zeros
	function stripTrailingZeros(integer)
	{
		while (integer.length > 1 && integer.charAt(integer.length - 1) === '0')
		{
			integer = integer.slice(0, -1);
		}
		return integer;
	}

	// Converts data from masked format (with static characters) to a format
	// with no static characters.
	// Example: changes 123-456-7890 to 1234567890
	function unMaskAlphaNumeric(varDataToUnmask, mask)
	{
		var strOutData = '';
		var dataPtr;
		var dataLength = varDataToUnmask.length;
		var readChar;
		var maskChar;

		for (dataPtr = 0; dataPtr < dataLength; dataPtr++)
		{
			readChar = varDataToUnmask.charAt(dataPtr);
			maskChar = mask.charAt(dataPtr);
			if (maskChar !== 'S')
			{
				strOutData = strOutData + readChar;
			}
		}
		return strOutData;
	}

	// Adds grouping symbols to the specified whole number
	function validateAddGroups(strWhole, strSymbol)
	{
		// default number of digits per group is 3 for all supported languages
		var nDigits = 3;
		var strGroupedWhole = "";
		var nWholeLength = strWhole.length;

		// from right-to-left, every nDigits characters
		for (var nCharIndex = nWholeLength - 1, nGroupIndex = 0; nCharIndex >= 0; nCharIndex--, nGroupIndex++)
		{
			if (nGroupIndex === nDigits)
			{
				strGroupedWhole = strSymbol + strGroupedWhole;
				nGroupIndex = 0;
			}

			// add a grouping symbol
			strGroupedWhole = strWhole.charAt(nCharIndex) + strGroupedWhole;
		}

		return strGroupedWhole;
	}

	// Remove any RTL Unicode display markers before attempting to parse a date
	function RemoveRTLDisplayMarkers(dateString)
	{
		return dateString.replace(/\u200F/g, "");
	}

	// Takes date in localized format using Western Arabic Numerals and returns:
	// LocaleDate - if the date is valid date
	// Error - validation error message from server
	function validateLocaleDate(date)
	{
		var localeDate = null;

		if (date.length > 0)
		{
			// If there is a date cached and if it matches the one being validated
			if (_cachedLocaleDate && _cachedLocaleDate[date] &&
				_cachedLocaleDate[date].LocaleDate && _cachedLocaleDate[date].LocaleDate.length > 0)
			{
				localeDate = _cachedLocaleDate[date];
			}
			else if (localeDate == null)
			{
				if ($OB !== null && virtualRoot !== null)
				{
					try
					{
						$OB.ajax({
							type: 'POST',
							url: virtualRoot + "/CalendarProvider.ashx",
							data: "type=validatedate&date=" + date,
							callback: function (response)
							{
								if (/^_error_/.test(response))
								{
									localeDate = { "date": date, "LocaleDate": "", "LocalDateTime": "", "Error": response.substring(7) };
								}
								else if (response.length > 0)
								{
									var dt = response.split("_DT_");
									//The date argument can be english/hindi digits - cache both so as to minimize server trips
									localeDate = _cachedLocaleDate[date] = { "date": date, "LocaleDate": dt[0], "LocaleDateTime": dt[1], "Error": "" };
									_cachedLocaleDate[localeDate.LocaleDate] = localeDate;
								}
							}
						});
					}
					catch (e)
					{
						localeDate = null;
					}
				}
				else
				{
					throw new window.Error("$OB needs to be specified for date validation on server.");
				}
			}
		}
		else
		{
			localeDate = { "date": "", "LocaleDate": "", "LocaleDateTime": "", "Error": "" };
		}

		return localeDate;
	}

	function validateLocaleDateRange(strFromDate, strToDate)
	{
		var isValid = false;
		$OB.ajax({
			type: 'POST',
			url: virtualRoot + "/CalendarProvider.ashx",
			data: "type=validatedaterange&fromdate=" + strFromDate + "&todate=" + strToDate,
			callback: function (response)
			{
				isValid = $OB.utils.isTrue(response);
			}
		});
		return isValid;
	}

	function isArabicLocale()
	{
		var isArabic = false;

		if (/^ar-/.test(_currentCultureName))
		{
			isArabic = true;
		}

		return isArabic;
	}

	return _public;
})(parseInt64, "$OB" in window ? window.$OB : parent.$OB);

// DataValidation Extensions
(function (win, dataValidation)
{
	function ValidationElement(params)
	{
		/// <summary>
		///
		/// </summary>
		/// <param name="params">
		/// Configuration object
		/// target : element selector to target
		/// validateEventsOn : Events to perform validation on
		/// onValidated : callback when validation completes
		/// overrideCharacters : overriden character byte mappings
		/// maxBytes : maximum number of character bytes to count
		/// </param>

		var _defaultParms = {
			target: null,
			messageElement: null,
			validateOn: 'keydown keyup cut change',
			onValidated: function () { },
			overrideCharacters: { '\r': 0, '\n': 2 },
			maxBytes: null,
			isValid: false
		};

		this.props = $OB.utils.merge(params, _defaultParms);

		if (typeof (this.props.target) === "string")
		{
			this.props.target = document.querySelector(this.props.target);
		}

		if (this.props.maxBytes === null)
		{
			throw "maxBytes must be provided";
		}

		if (typeof (this.props.target) !== "object")
		{
			throw "Could not locate validation object";
		}

		if (!$OB.utils.exists(this.props.target.value))
		{
			throw "Can only validate against elements that have a value property";
		}

		// Determine if developer passed an HTMLElement to target
		if (!(this.props.messageElement instanceof HTMLElement))
		{
			// Locate update element
			this.props.messageElement = document.querySelector('[data-validation-for="' + this.props.target.id + '"]');
        }

		// Wire up UI events on target element
		this._bindEvents();

		// Perform the validation at least once to set element styles. Perhaps this could
		// be toggled by a user parameter, or invoked manually by the client
		this._performValidation();

		var self = this;
		return {
			isValid: function ()
			{
				self._performValidation();
				return self.props.isValid;
			},
			// Object hiding intended
			target: self.props.target,
			messageElement: self.props.messageElement
		};
	}

	ValidationElement.prototype._bindEvents = function ()
	{
		/// <summary>
		/// Bind UI events
		/// </summary>

		var self = this;
		// Bind UI events
		$OB(this.props.target).addEvent(self.props.validateOn, function (evt)
		{
			self._performValidation();
		});
	};

	ValidationElement.prototype._performValidation = function ()
	{
		/// <summary>
		/// Perform validation and modify dependant elements
		/// based on validation response.
		/// </summary>

		var target = this.props.target;
		var messageElement = this.props.messageElement;
		var response = this._validateTextLimit(target);

		this.props.isValid = response.valid;

		if (response.valid)
		{
			$OB(target)
				.addClass('ui-valid')
                .removeClass('ui-invalid');

			$OB(messageElement)
				.addClass('valid')
				.removeClass('invalid');
		}
		else
		{
			$OB(target)
				.addClass('ui-invalid')
                .removeClass('ui-valid');

			$OB(messageElement)
				.addClass('invalid')
				.removeClass('valid');
		}

		this.props.onValidated({
			valid: response.valid,
			bytesRemaining: response.bytesRemaining,
			target: target,
			messageElement: messageElement
		});
	};

	ValidationElement.prototype._validateTextLimit = function (textElement)
	{
		/// <summary>
		/// Validates whether the note text is under the character limit
		/// </summary>
		/// <param name="textElement">Element containing text value</param>
		/// <returns type="object">Custom response object</returns>

		var totalBytes = dataValidation.getStringByteLength(textElement.value, this.props.overrideCharacters);

		var bytesRemaining = this.props.maxBytes - totalBytes;

		return {
			valid: bytesRemaining >= 0,
			bytesRemaining: bytesRemaining
		};
	};

	var _public = {
		create: function (params)
		{
			return new ValidationElement(params);
		}
	};

	// Hiding ValidationElement implmentation to a specific instance
	win.validation = {
		textAreaCount: _public
	};
})(window, DataValidation);


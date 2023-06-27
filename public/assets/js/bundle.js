/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@ethersproject/abi/lib.esm/_version.js":
/*!*************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/_version.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "abi/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/abi-coder.js":
/*!**************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/abi-coder.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AbiCoder": () => (/* binding */ AbiCoder),
/* harmony export */   "defaultAbiCoder": () => (/* binding */ defaultAbiCoder)
/* harmony export */ });
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/properties */ "./node_modules/@ethersproject/properties/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/abi/lib.esm/_version.js");
/* harmony import */ var _coders_abstract_coder__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./coders/abstract-coder */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");
/* harmony import */ var _coders_address__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./coders/address */ "./node_modules/@ethersproject/abi/lib.esm/coders/address.js");
/* harmony import */ var _coders_array__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./coders/array */ "./node_modules/@ethersproject/abi/lib.esm/coders/array.js");
/* harmony import */ var _coders_boolean__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./coders/boolean */ "./node_modules/@ethersproject/abi/lib.esm/coders/boolean.js");
/* harmony import */ var _coders_bytes__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./coders/bytes */ "./node_modules/@ethersproject/abi/lib.esm/coders/bytes.js");
/* harmony import */ var _coders_fixed_bytes__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./coders/fixed-bytes */ "./node_modules/@ethersproject/abi/lib.esm/coders/fixed-bytes.js");
/* harmony import */ var _coders_null__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./coders/null */ "./node_modules/@ethersproject/abi/lib.esm/coders/null.js");
/* harmony import */ var _coders_number__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./coders/number */ "./node_modules/@ethersproject/abi/lib.esm/coders/number.js");
/* harmony import */ var _coders_string__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./coders/string */ "./node_modules/@ethersproject/abi/lib.esm/coders/string.js");
/* harmony import */ var _coders_tuple__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./coders/tuple */ "./node_modules/@ethersproject/abi/lib.esm/coders/tuple.js");
/* harmony import */ var _fragments__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./fragments */ "./node_modules/@ethersproject/abi/lib.esm/fragments.js");

// See: https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI




const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);











const paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);
class AbiCoder {
    constructor(coerceFunc) {
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.defineReadOnly)(this, "coerceFunc", coerceFunc || null);
    }
    _getCoder(param) {
        switch (param.baseType) {
            case "address":
                return new _coders_address__WEBPACK_IMPORTED_MODULE_3__.AddressCoder(param.name);
            case "bool":
                return new _coders_boolean__WEBPACK_IMPORTED_MODULE_4__.BooleanCoder(param.name);
            case "string":
                return new _coders_string__WEBPACK_IMPORTED_MODULE_5__.StringCoder(param.name);
            case "bytes":
                return new _coders_bytes__WEBPACK_IMPORTED_MODULE_6__.BytesCoder(param.name);
            case "array":
                return new _coders_array__WEBPACK_IMPORTED_MODULE_7__.ArrayCoder(this._getCoder(param.arrayChildren), param.arrayLength, param.name);
            case "tuple":
                return new _coders_tuple__WEBPACK_IMPORTED_MODULE_8__.TupleCoder((param.components || []).map((component) => {
                    return this._getCoder(component);
                }), param.name);
            case "":
                return new _coders_null__WEBPACK_IMPORTED_MODULE_9__.NullCoder(param.name);
        }
        // u?int[0-9]*
        let match = param.type.match(paramTypeNumber);
        if (match) {
            let size = parseInt(match[2] || "256");
            if (size === 0 || size > 256 || (size % 8) !== 0) {
                logger.throwArgumentError("invalid " + match[1] + " bit length", "param", param);
            }
            return new _coders_number__WEBPACK_IMPORTED_MODULE_10__.NumberCoder(size / 8, (match[1] === "int"), param.name);
        }
        // bytes[0-9]+
        match = param.type.match(paramTypeBytes);
        if (match) {
            let size = parseInt(match[1]);
            if (size === 0 || size > 32) {
                logger.throwArgumentError("invalid bytes length", "param", param);
            }
            return new _coders_fixed_bytes__WEBPACK_IMPORTED_MODULE_11__.FixedBytesCoder(size, param.name);
        }
        return logger.throwArgumentError("invalid type", "type", param.type);
    }
    _getWordSize() { return 32; }
    _getReader(data, allowLoose) {
        return new _coders_abstract_coder__WEBPACK_IMPORTED_MODULE_12__.Reader(data, this._getWordSize(), this.coerceFunc, allowLoose);
    }
    _getWriter() {
        return new _coders_abstract_coder__WEBPACK_IMPORTED_MODULE_12__.Writer(this._getWordSize());
    }
    getDefaultValue(types) {
        const coders = types.map((type) => this._getCoder(_fragments__WEBPACK_IMPORTED_MODULE_13__.ParamType.from(type)));
        const coder = new _coders_tuple__WEBPACK_IMPORTED_MODULE_8__.TupleCoder(coders, "_");
        return coder.defaultValue();
    }
    encode(types, values) {
        if (types.length !== values.length) {
            logger.throwError("types/values length mismatch", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.INVALID_ARGUMENT, {
                count: { types: types.length, values: values.length },
                value: { types: types, values: values }
            });
        }
        const coders = types.map((type) => this._getCoder(_fragments__WEBPACK_IMPORTED_MODULE_13__.ParamType.from(type)));
        const coder = (new _coders_tuple__WEBPACK_IMPORTED_MODULE_8__.TupleCoder(coders, "_"));
        const writer = this._getWriter();
        coder.encode(writer, values);
        return writer.data;
    }
    decode(types, data, loose) {
        const coders = types.map((type) => this._getCoder(_fragments__WEBPACK_IMPORTED_MODULE_13__.ParamType.from(type)));
        const coder = new _coders_tuple__WEBPACK_IMPORTED_MODULE_8__.TupleCoder(coders, "_");
        return coder.decode(this._getReader((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_14__.arrayify)(data), loose));
    }
}
const defaultAbiCoder = new AbiCoder();
//# sourceMappingURL=abi-coder.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js":
/*!**************************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js ***!
  \**************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Coder": () => (/* binding */ Coder),
/* harmony export */   "Reader": () => (/* binding */ Reader),
/* harmony export */   "Writer": () => (/* binding */ Writer),
/* harmony export */   "checkResultErrors": () => (/* binding */ checkResultErrors)
/* harmony export */ });
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @ethersproject/bignumber */ "./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js");
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/properties */ "./node_modules/@ethersproject/properties/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../_version */ "./node_modules/@ethersproject/abi/lib.esm/_version.js");






const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
function checkResultErrors(result) {
    // Find the first error (if any)
    const errors = [];
    const checkErrors = function (path, object) {
        if (!Array.isArray(object)) {
            return;
        }
        for (let key in object) {
            const childPath = path.slice();
            childPath.push(key);
            try {
                checkErrors(childPath, object[key]);
            }
            catch (error) {
                errors.push({ path: childPath, error: error });
            }
        }
    };
    checkErrors([], result);
    return errors;
}
class Coder {
    constructor(name, type, localName, dynamic) {
        // @TODO: defineReadOnly these
        this.name = name;
        this.type = type;
        this.localName = localName;
        this.dynamic = dynamic;
    }
    _throwError(message, value) {
        logger.throwArgumentError(message, this.localName, value);
    }
}
class Writer {
    constructor(wordSize) {
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.defineReadOnly)(this, "wordSize", wordSize || 32);
        this._data = [];
        this._dataLength = 0;
        this._padding = new Uint8Array(wordSize);
    }
    get data() {
        return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.hexConcat)(this._data);
    }
    get length() { return this._dataLength; }
    _writeData(data) {
        this._data.push(data);
        this._dataLength += data.length;
        return data.length;
    }
    appendWriter(writer) {
        return this._writeData((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.concat)(writer._data));
    }
    // Arrayish items; padded on the right to wordSize
    writeBytes(value) {
        let bytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.arrayify)(value);
        const paddingOffset = bytes.length % this.wordSize;
        if (paddingOffset) {
            bytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.concat)([bytes, this._padding.slice(paddingOffset)]);
        }
        return this._writeData(bytes);
    }
    _getValue(value) {
        let bytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.arrayify)(_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(value));
        if (bytes.length > this.wordSize) {
            logger.throwError("value out-of-bounds", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN, {
                length: this.wordSize,
                offset: bytes.length
            });
        }
        if (bytes.length % this.wordSize) {
            bytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.concat)([this._padding.slice(bytes.length % this.wordSize), bytes]);
        }
        return bytes;
    }
    // BigNumberish items; padded on the left to wordSize
    writeValue(value) {
        return this._writeData(this._getValue(value));
    }
    writeUpdatableValue() {
        const offset = this._data.length;
        this._data.push(this._padding);
        this._dataLength += this.wordSize;
        return (value) => {
            this._data[offset] = this._getValue(value);
        };
    }
}
class Reader {
    constructor(data, wordSize, coerceFunc, allowLoose) {
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.defineReadOnly)(this, "_data", (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.arrayify)(data));
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.defineReadOnly)(this, "wordSize", wordSize || 32);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.defineReadOnly)(this, "_coerceFunc", coerceFunc);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.defineReadOnly)(this, "allowLoose", allowLoose);
        this._offset = 0;
    }
    get data() { return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.hexlify)(this._data); }
    get consumed() { return this._offset; }
    // The default Coerce function
    static coerce(name, value) {
        let match = name.match("^u?int([0-9]+)$");
        if (match && parseInt(match[1]) <= 48) {
            value = value.toNumber();
        }
        return value;
    }
    coerce(name, value) {
        if (this._coerceFunc) {
            return this._coerceFunc(name, value);
        }
        return Reader.coerce(name, value);
    }
    _peekBytes(offset, length, loose) {
        let alignedLength = Math.ceil(length / this.wordSize) * this.wordSize;
        if (this._offset + alignedLength > this._data.length) {
            if (this.allowLoose && loose && this._offset + length <= this._data.length) {
                alignedLength = length;
            }
            else {
                logger.throwError("data out-of-bounds", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN, {
                    length: this._data.length,
                    offset: this._offset + alignedLength
                });
            }
        }
        return this._data.slice(this._offset, this._offset + alignedLength);
    }
    subReader(offset) {
        return new Reader(this._data.slice(this._offset + offset), this.wordSize, this._coerceFunc, this.allowLoose);
    }
    readBytes(length, loose) {
        let bytes = this._peekBytes(0, length, !!loose);
        this._offset += bytes.length;
        // @TODO: Make sure the length..end bytes are all 0?
        return bytes.slice(0, length);
    }
    readValue() {
        return _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(this.readBytes(this.wordSize));
    }
}
//# sourceMappingURL=abstract-coder.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/coders/address.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/coders/address.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AddressCoder": () => (/* binding */ AddressCoder)
/* harmony export */ });
/* harmony import */ var _ethersproject_address__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ethersproject/address */ "./node_modules/@ethersproject/address/lib.esm/index.js");
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _abstract_coder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");




class AddressCoder extends _abstract_coder__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(localName) {
        super("address", "address", localName, false);
    }
    defaultValue() {
        return "0x0000000000000000000000000000000000000000";
    }
    encode(writer, value) {
        try {
            value = (0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_1__.getAddress)(value);
        }
        catch (error) {
            this._throwError(error.message, value);
        }
        return writer.writeValue(value);
    }
    decode(reader) {
        return (0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_1__.getAddress)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.hexZeroPad)(reader.readValue().toHexString(), 20));
    }
}
//# sourceMappingURL=address.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/coders/anonymous.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/coders/anonymous.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AnonymousCoder": () => (/* binding */ AnonymousCoder)
/* harmony export */ });
/* harmony import */ var _abstract_coder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");


// Clones the functionality of an existing Coder, but without a localName
class AnonymousCoder extends _abstract_coder__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(coder) {
        super(coder.name, coder.type, undefined, coder.dynamic);
        this.coder = coder;
    }
    defaultValue() {
        return this.coder.defaultValue();
    }
    encode(writer, value) {
        return this.coder.encode(writer, value);
    }
    decode(reader) {
        return this.coder.decode(reader);
    }
}
//# sourceMappingURL=anonymous.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/coders/array.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/coders/array.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ArrayCoder": () => (/* binding */ ArrayCoder),
/* harmony export */   "pack": () => (/* binding */ pack),
/* harmony export */   "unpack": () => (/* binding */ unpack)
/* harmony export */ });
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../_version */ "./node_modules/@ethersproject/abi/lib.esm/_version.js");
/* harmony import */ var _abstract_coder__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./abstract-coder */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");
/* harmony import */ var _anonymous__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./anonymous */ "./node_modules/@ethersproject/abi/lib.esm/coders/anonymous.js");



const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);


function pack(writer, coders, values) {
    let arrayValues = null;
    if (Array.isArray(values)) {
        arrayValues = values;
    }
    else if (values && typeof (values) === "object") {
        let unique = {};
        arrayValues = coders.map((coder) => {
            const name = coder.localName;
            if (!name) {
                logger.throwError("cannot encode object for signature with missing names", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.INVALID_ARGUMENT, {
                    argument: "values",
                    coder: coder,
                    value: values
                });
            }
            if (unique[name]) {
                logger.throwError("cannot encode object for signature with duplicate names", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.INVALID_ARGUMENT, {
                    argument: "values",
                    coder: coder,
                    value: values
                });
            }
            unique[name] = true;
            return values[name];
        });
    }
    else {
        logger.throwArgumentError("invalid tuple value", "tuple", values);
    }
    if (coders.length !== arrayValues.length) {
        logger.throwArgumentError("types/value length mismatch", "tuple", values);
    }
    let staticWriter = new _abstract_coder__WEBPACK_IMPORTED_MODULE_2__.Writer(writer.wordSize);
    let dynamicWriter = new _abstract_coder__WEBPACK_IMPORTED_MODULE_2__.Writer(writer.wordSize);
    let updateFuncs = [];
    coders.forEach((coder, index) => {
        let value = arrayValues[index];
        if (coder.dynamic) {
            // Get current dynamic offset (for the future pointer)
            let dynamicOffset = dynamicWriter.length;
            // Encode the dynamic value into the dynamicWriter
            coder.encode(dynamicWriter, value);
            // Prepare to populate the correct offset once we are done
            let updateFunc = staticWriter.writeUpdatableValue();
            updateFuncs.push((baseOffset) => {
                updateFunc(baseOffset + dynamicOffset);
            });
        }
        else {
            coder.encode(staticWriter, value);
        }
    });
    // Backfill all the dynamic offsets, now that we know the static length
    updateFuncs.forEach((func) => { func(staticWriter.length); });
    let length = writer.appendWriter(staticWriter);
    length += writer.appendWriter(dynamicWriter);
    return length;
}
function unpack(reader, coders) {
    let values = [];
    // A reader anchored to this base
    let baseReader = reader.subReader(0);
    coders.forEach((coder) => {
        let value = null;
        if (coder.dynamic) {
            let offset = reader.readValue();
            let offsetReader = baseReader.subReader(offset.toNumber());
            try {
                value = coder.decode(offsetReader);
            }
            catch (error) {
                // Cannot recover from this
                if (error.code === _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN) {
                    throw error;
                }
                value = error;
                value.baseType = coder.name;
                value.name = coder.localName;
                value.type = coder.type;
            }
        }
        else {
            try {
                value = coder.decode(reader);
            }
            catch (error) {
                // Cannot recover from this
                if (error.code === _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN) {
                    throw error;
                }
                value = error;
                value.baseType = coder.name;
                value.name = coder.localName;
                value.type = coder.type;
            }
        }
        if (value != undefined) {
            values.push(value);
        }
    });
    // We only output named properties for uniquely named coders
    const uniqueNames = coders.reduce((accum, coder) => {
        const name = coder.localName;
        if (name) {
            if (!accum[name]) {
                accum[name] = 0;
            }
            accum[name]++;
        }
        return accum;
    }, {});
    // Add any named parameters (i.e. tuples)
    coders.forEach((coder, index) => {
        let name = coder.localName;
        if (!name || uniqueNames[name] !== 1) {
            return;
        }
        if (name === "length") {
            name = "_length";
        }
        if (values[name] != null) {
            return;
        }
        const value = values[index];
        if (value instanceof Error) {
            Object.defineProperty(values, name, {
                enumerable: true,
                get: () => { throw value; }
            });
        }
        else {
            values[name] = value;
        }
    });
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (value instanceof Error) {
            Object.defineProperty(values, i, {
                enumerable: true,
                get: () => { throw value; }
            });
        }
    }
    return Object.freeze(values);
}
class ArrayCoder extends _abstract_coder__WEBPACK_IMPORTED_MODULE_2__.Coder {
    constructor(coder, length, localName) {
        const type = (coder.type + "[" + (length >= 0 ? length : "") + "]");
        const dynamic = (length === -1 || coder.dynamic);
        super("array", type, localName, dynamic);
        this.coder = coder;
        this.length = length;
    }
    defaultValue() {
        // Verifies the child coder is valid (even if the array is dynamic or 0-length)
        const defaultChild = this.coder.defaultValue();
        const result = [];
        for (let i = 0; i < this.length; i++) {
            result.push(defaultChild);
        }
        return result;
    }
    encode(writer, value) {
        if (!Array.isArray(value)) {
            this._throwError("expected array value", value);
        }
        let count = this.length;
        if (count === -1) {
            count = value.length;
            writer.writeValue(value.length);
        }
        logger.checkArgumentCount(value.length, count, "coder array" + (this.localName ? (" " + this.localName) : ""));
        let coders = [];
        for (let i = 0; i < value.length; i++) {
            coders.push(this.coder);
        }
        return pack(writer, coders, value);
    }
    decode(reader) {
        let count = this.length;
        if (count === -1) {
            count = reader.readValue().toNumber();
            // Check that there is *roughly* enough data to ensure
            // stray random data is not being read as a length. Each
            // slot requires at least 32 bytes for their value (or 32
            // bytes as a link to the data). This could use a much
            // tighter bound, but we are erroring on the side of safety.
            if (count * 32 > reader._data.length) {
                logger.throwError("insufficient data length", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN, {
                    length: reader._data.length,
                    count: count
                });
            }
        }
        let coders = [];
        for (let i = 0; i < count; i++) {
            coders.push(new _anonymous__WEBPACK_IMPORTED_MODULE_3__.AnonymousCoder(this.coder));
        }
        return reader.coerce(this.name, unpack(reader, coders));
    }
}
//# sourceMappingURL=array.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/coders/boolean.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/coders/boolean.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BooleanCoder": () => (/* binding */ BooleanCoder)
/* harmony export */ });
/* harmony import */ var _abstract_coder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");


class BooleanCoder extends _abstract_coder__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(localName) {
        super("bool", "bool", localName, false);
    }
    defaultValue() {
        return false;
    }
    encode(writer, value) {
        return writer.writeValue(value ? 1 : 0);
    }
    decode(reader) {
        return reader.coerce(this.type, !reader.readValue().isZero());
    }
}
//# sourceMappingURL=boolean.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/coders/bytes.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/coders/bytes.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BytesCoder": () => (/* binding */ BytesCoder),
/* harmony export */   "DynamicBytesCoder": () => (/* binding */ DynamicBytesCoder)
/* harmony export */ });
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _abstract_coder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");



class DynamicBytesCoder extends _abstract_coder__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(type, localName) {
        super(type, type, localName, true);
    }
    defaultValue() {
        return "0x";
    }
    encode(writer, value) {
        value = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__.arrayify)(value);
        let length = writer.writeValue(value.length);
        length += writer.writeBytes(value);
        return length;
    }
    decode(reader) {
        return reader.readBytes(reader.readValue().toNumber(), true);
    }
}
class BytesCoder extends DynamicBytesCoder {
    constructor(localName) {
        super("bytes", localName);
    }
    decode(reader) {
        return reader.coerce(this.name, (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__.hexlify)(super.decode(reader)));
    }
}
//# sourceMappingURL=bytes.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/coders/fixed-bytes.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/coders/fixed-bytes.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FixedBytesCoder": () => (/* binding */ FixedBytesCoder)
/* harmony export */ });
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _abstract_coder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");



// @TODO: Merge this with bytes
class FixedBytesCoder extends _abstract_coder__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(size, localName) {
        let name = "bytes" + String(size);
        super(name, name, localName, false);
        this.size = size;
    }
    defaultValue() {
        return ("0x0000000000000000000000000000000000000000000000000000000000000000").substring(0, 2 + this.size * 2);
    }
    encode(writer, value) {
        let data = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__.arrayify)(value);
        if (data.length !== this.size) {
            this._throwError("incorrect data length", value);
        }
        return writer.writeBytes(data);
    }
    decode(reader) {
        return reader.coerce(this.name, (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__.hexlify)(reader.readBytes(this.size)));
    }
}
//# sourceMappingURL=fixed-bytes.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/coders/null.js":
/*!****************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/coders/null.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NullCoder": () => (/* binding */ NullCoder)
/* harmony export */ });
/* harmony import */ var _abstract_coder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");


class NullCoder extends _abstract_coder__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(localName) {
        super("null", "", localName, false);
    }
    defaultValue() {
        return null;
    }
    encode(writer, value) {
        if (value != null) {
            this._throwError("not null", value);
        }
        return writer.writeBytes([]);
    }
    decode(reader) {
        reader.readBytes(0);
        return reader.coerce(this.name, null);
    }
}
//# sourceMappingURL=null.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/coders/number.js":
/*!******************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/coders/number.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NumberCoder": () => (/* binding */ NumberCoder)
/* harmony export */ });
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ethersproject/bignumber */ "./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js");
/* harmony import */ var _ethersproject_constants__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/constants */ "./node_modules/@ethersproject/constants/lib.esm/bignumbers.js");
/* harmony import */ var _abstract_coder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");




class NumberCoder extends _abstract_coder__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(size, signed, localName) {
        const name = ((signed ? "int" : "uint") + (size * 8));
        super(name, name, localName, false);
        this.size = size;
        this.signed = signed;
    }
    defaultValue() {
        return 0;
    }
    encode(writer, value) {
        let v = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_1__.BigNumber.from(value);
        // Check bounds are safe for encoding
        let maxUintValue = _ethersproject_constants__WEBPACK_IMPORTED_MODULE_2__.MaxUint256.mask(writer.wordSize * 8);
        if (this.signed) {
            let bounds = maxUintValue.mask(this.size * 8 - 1);
            if (v.gt(bounds) || v.lt(bounds.add(_ethersproject_constants__WEBPACK_IMPORTED_MODULE_2__.One).mul(_ethersproject_constants__WEBPACK_IMPORTED_MODULE_2__.NegativeOne))) {
                this._throwError("value out-of-bounds", value);
            }
        }
        else if (v.lt(_ethersproject_constants__WEBPACK_IMPORTED_MODULE_2__.Zero) || v.gt(maxUintValue.mask(this.size * 8))) {
            this._throwError("value out-of-bounds", value);
        }
        v = v.toTwos(this.size * 8).mask(this.size * 8);
        if (this.signed) {
            v = v.fromTwos(this.size * 8).toTwos(8 * writer.wordSize);
        }
        return writer.writeValue(v);
    }
    decode(reader) {
        let value = reader.readValue().mask(this.size * 8);
        if (this.signed) {
            value = value.fromTwos(this.size * 8);
        }
        return reader.coerce(this.name, value);
    }
}
//# sourceMappingURL=number.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/coders/string.js":
/*!******************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/coders/string.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "StringCoder": () => (/* binding */ StringCoder)
/* harmony export */ });
/* harmony import */ var _ethersproject_strings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ethersproject/strings */ "./node_modules/@ethersproject/strings/lib.esm/utf8.js");
/* harmony import */ var _bytes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./bytes */ "./node_modules/@ethersproject/abi/lib.esm/coders/bytes.js");



class StringCoder extends _bytes__WEBPACK_IMPORTED_MODULE_0__.DynamicBytesCoder {
    constructor(localName) {
        super("string", localName);
    }
    defaultValue() {
        return "";
    }
    encode(writer, value) {
        return super.encode(writer, (0,_ethersproject_strings__WEBPACK_IMPORTED_MODULE_1__.toUtf8Bytes)(value));
    }
    decode(reader) {
        return (0,_ethersproject_strings__WEBPACK_IMPORTED_MODULE_1__.toUtf8String)(super.decode(reader));
    }
}
//# sourceMappingURL=string.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/coders/tuple.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/coders/tuple.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TupleCoder": () => (/* binding */ TupleCoder)
/* harmony export */ });
/* harmony import */ var _abstract_coder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract-coder */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");
/* harmony import */ var _array__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./array */ "./node_modules/@ethersproject/abi/lib.esm/coders/array.js");



class TupleCoder extends _abstract_coder__WEBPACK_IMPORTED_MODULE_0__.Coder {
    constructor(coders, localName) {
        let dynamic = false;
        const types = [];
        coders.forEach((coder) => {
            if (coder.dynamic) {
                dynamic = true;
            }
            types.push(coder.type);
        });
        const type = ("tuple(" + types.join(",") + ")");
        super("tuple", type, localName, dynamic);
        this.coders = coders;
    }
    defaultValue() {
        const values = [];
        this.coders.forEach((coder) => {
            values.push(coder.defaultValue());
        });
        // We only output named properties for uniquely named coders
        const uniqueNames = this.coders.reduce((accum, coder) => {
            const name = coder.localName;
            if (name) {
                if (!accum[name]) {
                    accum[name] = 0;
                }
                accum[name]++;
            }
            return accum;
        }, {});
        // Add named values
        this.coders.forEach((coder, index) => {
            let name = coder.localName;
            if (!name || uniqueNames[name] !== 1) {
                return;
            }
            if (name === "length") {
                name = "_length";
            }
            if (values[name] != null) {
                return;
            }
            values[name] = values[index];
        });
        return Object.freeze(values);
    }
    encode(writer, value) {
        return (0,_array__WEBPACK_IMPORTED_MODULE_1__.pack)(writer, this.coders, value);
    }
    decode(reader) {
        return reader.coerce(this.name, (0,_array__WEBPACK_IMPORTED_MODULE_1__.unpack)(reader, this.coders));
    }
}
//# sourceMappingURL=tuple.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/fragments.js":
/*!**************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/fragments.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ConstructorFragment": () => (/* binding */ ConstructorFragment),
/* harmony export */   "ErrorFragment": () => (/* binding */ ErrorFragment),
/* harmony export */   "EventFragment": () => (/* binding */ EventFragment),
/* harmony export */   "FormatTypes": () => (/* binding */ FormatTypes),
/* harmony export */   "Fragment": () => (/* binding */ Fragment),
/* harmony export */   "FunctionFragment": () => (/* binding */ FunctionFragment),
/* harmony export */   "ParamType": () => (/* binding */ ParamType)
/* harmony export */ });
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @ethersproject/bignumber */ "./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js");
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/properties */ "./node_modules/@ethersproject/properties/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/abi/lib.esm/_version.js");





const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
;
const _constructorGuard = {};
let ModifiersBytes = { calldata: true, memory: true, storage: true };
let ModifiersNest = { calldata: true, memory: true };
function checkModifier(type, name) {
    if (type === "bytes" || type === "string") {
        if (ModifiersBytes[name]) {
            return true;
        }
    }
    else if (type === "address") {
        if (name === "payable") {
            return true;
        }
    }
    else if (type.indexOf("[") >= 0 || type === "tuple") {
        if (ModifiersNest[name]) {
            return true;
        }
    }
    if (ModifiersBytes[name] || name === "payable") {
        logger.throwArgumentError("invalid modifier", "name", name);
    }
    return false;
}
// @TODO: Make sure that children of an indexed tuple are marked with a null indexed
function parseParamType(param, allowIndexed) {
    let originalParam = param;
    function throwError(i) {
        logger.throwArgumentError(`unexpected character at position ${i}`, "param", param);
    }
    param = param.replace(/\s/g, " ");
    function newNode(parent) {
        let node = { type: "", name: "", parent: parent, state: { allowType: true } };
        if (allowIndexed) {
            node.indexed = false;
        }
        return node;
    }
    let parent = { type: "", name: "", state: { allowType: true } };
    let node = parent;
    for (let i = 0; i < param.length; i++) {
        let c = param[i];
        switch (c) {
            case "(":
                if (node.state.allowType && node.type === "") {
                    node.type = "tuple";
                }
                else if (!node.state.allowParams) {
                    throwError(i);
                }
                node.state.allowType = false;
                node.type = verifyType(node.type);
                node.components = [newNode(node)];
                node = node.components[0];
                break;
            case ")":
                delete node.state;
                if (node.name === "indexed") {
                    if (!allowIndexed) {
                        throwError(i);
                    }
                    node.indexed = true;
                    node.name = "";
                }
                if (checkModifier(node.type, node.name)) {
                    node.name = "";
                }
                node.type = verifyType(node.type);
                let child = node;
                node = node.parent;
                if (!node) {
                    throwError(i);
                }
                delete child.parent;
                node.state.allowParams = false;
                node.state.allowName = true;
                node.state.allowArray = true;
                break;
            case ",":
                delete node.state;
                if (node.name === "indexed") {
                    if (!allowIndexed) {
                        throwError(i);
                    }
                    node.indexed = true;
                    node.name = "";
                }
                if (checkModifier(node.type, node.name)) {
                    node.name = "";
                }
                node.type = verifyType(node.type);
                let sibling = newNode(node.parent);
                //{ type: "", name: "", parent: node.parent, state: { allowType: true } };
                node.parent.components.push(sibling);
                delete node.parent;
                node = sibling;
                break;
            // Hit a space...
            case " ":
                // If reading type, the type is done and may read a param or name
                if (node.state.allowType) {
                    if (node.type !== "") {
                        node.type = verifyType(node.type);
                        delete node.state.allowType;
                        node.state.allowName = true;
                        node.state.allowParams = true;
                    }
                }
                // If reading name, the name is done
                if (node.state.allowName) {
                    if (node.name !== "") {
                        if (node.name === "indexed") {
                            if (!allowIndexed) {
                                throwError(i);
                            }
                            if (node.indexed) {
                                throwError(i);
                            }
                            node.indexed = true;
                            node.name = "";
                        }
                        else if (checkModifier(node.type, node.name)) {
                            node.name = "";
                        }
                        else {
                            node.state.allowName = false;
                        }
                    }
                }
                break;
            case "[":
                if (!node.state.allowArray) {
                    throwError(i);
                }
                node.type += c;
                node.state.allowArray = false;
                node.state.allowName = false;
                node.state.readArray = true;
                break;
            case "]":
                if (!node.state.readArray) {
                    throwError(i);
                }
                node.type += c;
                node.state.readArray = false;
                node.state.allowArray = true;
                node.state.allowName = true;
                break;
            default:
                if (node.state.allowType) {
                    node.type += c;
                    node.state.allowParams = true;
                    node.state.allowArray = true;
                }
                else if (node.state.allowName) {
                    node.name += c;
                    delete node.state.allowArray;
                }
                else if (node.state.readArray) {
                    node.type += c;
                }
                else {
                    throwError(i);
                }
        }
    }
    if (node.parent) {
        logger.throwArgumentError("unexpected eof", "param", param);
    }
    delete parent.state;
    if (node.name === "indexed") {
        if (!allowIndexed) {
            throwError(originalParam.length - 7);
        }
        if (node.indexed) {
            throwError(originalParam.length - 7);
        }
        node.indexed = true;
        node.name = "";
    }
    else if (checkModifier(node.type, node.name)) {
        node.name = "";
    }
    parent.type = verifyType(parent.type);
    return parent;
}
function populate(object, params) {
    for (let key in params) {
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.defineReadOnly)(object, key, params[key]);
    }
}
const FormatTypes = Object.freeze({
    // Bare formatting, as is needed for computing a sighash of an event or function
    sighash: "sighash",
    // Human-Readable with Minimal spacing and without names (compact human-readable)
    minimal: "minimal",
    // Human-Readable with nice spacing, including all names
    full: "full",
    // JSON-format a la Solidity
    json: "json"
});
const paramTypeArray = new RegExp(/^(.*)\[([0-9]*)\]$/);
class ParamType {
    constructor(constructorGuard, params) {
        if (constructorGuard !== _constructorGuard) {
            logger.throwError("use fromString", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "new ParamType()"
            });
        }
        populate(this, params);
        let match = this.type.match(paramTypeArray);
        if (match) {
            populate(this, {
                arrayLength: parseInt(match[2] || "-1"),
                arrayChildren: ParamType.fromObject({
                    type: match[1],
                    components: this.components
                }),
                baseType: "array"
            });
        }
        else {
            populate(this, {
                arrayLength: null,
                arrayChildren: null,
                baseType: ((this.components != null) ? "tuple" : this.type)
            });
        }
        this._isParamType = true;
        Object.freeze(this);
    }
    // Format the parameter fragment
    //   - sighash: "(uint256,address)"
    //   - minimal: "tuple(uint256,address) indexed"
    //   - full:    "tuple(uint256 foo, address bar) indexed baz"
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            let result = {
                type: ((this.baseType === "tuple") ? "tuple" : this.type),
                name: (this.name || undefined)
            };
            if (typeof (this.indexed) === "boolean") {
                result.indexed = this.indexed;
            }
            if (this.components) {
                result.components = this.components.map((comp) => JSON.parse(comp.format(format)));
            }
            return JSON.stringify(result);
        }
        let result = "";
        // Array
        if (this.baseType === "array") {
            result += this.arrayChildren.format(format);
            result += "[" + (this.arrayLength < 0 ? "" : String(this.arrayLength)) + "]";
        }
        else {
            if (this.baseType === "tuple") {
                if (format !== FormatTypes.sighash) {
                    result += this.type;
                }
                result += "(" + this.components.map((comp) => comp.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ")";
            }
            else {
                result += this.type;
            }
        }
        if (format !== FormatTypes.sighash) {
            if (this.indexed === true) {
                result += " indexed";
            }
            if (format === FormatTypes.full && this.name) {
                result += " " + this.name;
            }
        }
        return result;
    }
    static from(value, allowIndexed) {
        if (typeof (value) === "string") {
            return ParamType.fromString(value, allowIndexed);
        }
        return ParamType.fromObject(value);
    }
    static fromObject(value) {
        if (ParamType.isParamType(value)) {
            return value;
        }
        return new ParamType(_constructorGuard, {
            name: (value.name || null),
            type: verifyType(value.type),
            indexed: ((value.indexed == null) ? null : !!value.indexed),
            components: (value.components ? value.components.map(ParamType.fromObject) : null)
        });
    }
    static fromString(value, allowIndexed) {
        function ParamTypify(node) {
            return ParamType.fromObject({
                name: node.name,
                type: node.type,
                indexed: node.indexed,
                components: node.components
            });
        }
        return ParamTypify(parseParamType(value, !!allowIndexed));
    }
    static isParamType(value) {
        return !!(value != null && value._isParamType);
    }
}
;
function parseParams(value, allowIndex) {
    return splitNesting(value).map((param) => ParamType.fromString(param, allowIndex));
}
class Fragment {
    constructor(constructorGuard, params) {
        if (constructorGuard !== _constructorGuard) {
            logger.throwError("use a static from method", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "new Fragment()"
            });
        }
        populate(this, params);
        this._isFragment = true;
        Object.freeze(this);
    }
    static from(value) {
        if (Fragment.isFragment(value)) {
            return value;
        }
        if (typeof (value) === "string") {
            return Fragment.fromString(value);
        }
        return Fragment.fromObject(value);
    }
    static fromObject(value) {
        if (Fragment.isFragment(value)) {
            return value;
        }
        switch (value.type) {
            case "function":
                return FunctionFragment.fromObject(value);
            case "event":
                return EventFragment.fromObject(value);
            case "constructor":
                return ConstructorFragment.fromObject(value);
            case "error":
                return ErrorFragment.fromObject(value);
            case "fallback":
            case "receive":
                // @TODO: Something? Maybe return a FunctionFragment? A custom DefaultFunctionFragment?
                return null;
        }
        return logger.throwArgumentError("invalid fragment object", "value", value);
    }
    static fromString(value) {
        // Make sure the "returns" is surrounded by a space and all whitespace is exactly one space
        value = value.replace(/\s/g, " ");
        value = value.replace(/\(/g, " (").replace(/\)/g, ") ").replace(/\s+/g, " ");
        value = value.trim();
        if (value.split(" ")[0] === "event") {
            return EventFragment.fromString(value.substring(5).trim());
        }
        else if (value.split(" ")[0] === "function") {
            return FunctionFragment.fromString(value.substring(8).trim());
        }
        else if (value.split("(")[0].trim() === "constructor") {
            return ConstructorFragment.fromString(value.trim());
        }
        else if (value.split(" ")[0] === "error") {
            return ErrorFragment.fromString(value.substring(5).trim());
        }
        return logger.throwArgumentError("unsupported fragment", "value", value);
    }
    static isFragment(value) {
        return !!(value && value._isFragment);
    }
}
class EventFragment extends Fragment {
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            return JSON.stringify({
                type: "event",
                anonymous: this.anonymous,
                name: this.name,
                inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
            });
        }
        let result = "";
        if (format !== FormatTypes.sighash) {
            result += "event ";
        }
        result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
        if (format !== FormatTypes.sighash) {
            if (this.anonymous) {
                result += "anonymous ";
            }
        }
        return result.trim();
    }
    static from(value) {
        if (typeof (value) === "string") {
            return EventFragment.fromString(value);
        }
        return EventFragment.fromObject(value);
    }
    static fromObject(value) {
        if (EventFragment.isEventFragment(value)) {
            return value;
        }
        if (value.type !== "event") {
            logger.throwArgumentError("invalid event object", "value", value);
        }
        const params = {
            name: verifyIdentifier(value.name),
            anonymous: value.anonymous,
            inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
            type: "event"
        };
        return new EventFragment(_constructorGuard, params);
    }
    static fromString(value) {
        let match = value.match(regexParen);
        if (!match) {
            logger.throwArgumentError("invalid event string", "value", value);
        }
        let anonymous = false;
        match[3].split(" ").forEach((modifier) => {
            switch (modifier.trim()) {
                case "anonymous":
                    anonymous = true;
                    break;
                case "":
                    break;
                default:
                    logger.warn("unknown modifier: " + modifier);
            }
        });
        return EventFragment.fromObject({
            name: match[1].trim(),
            anonymous: anonymous,
            inputs: parseParams(match[2], true),
            type: "event"
        });
    }
    static isEventFragment(value) {
        return (value && value._isFragment && value.type === "event");
    }
}
function parseGas(value, params) {
    params.gas = null;
    let comps = value.split("@");
    if (comps.length !== 1) {
        if (comps.length > 2) {
            logger.throwArgumentError("invalid human-readable ABI signature", "value", value);
        }
        if (!comps[1].match(/^[0-9]+$/)) {
            logger.throwArgumentError("invalid human-readable ABI signature gas", "value", value);
        }
        params.gas = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_3__.BigNumber.from(comps[1]);
        return comps[0];
    }
    return value;
}
function parseModifiers(value, params) {
    params.constant = false;
    params.payable = false;
    params.stateMutability = "nonpayable";
    value.split(" ").forEach((modifier) => {
        switch (modifier.trim()) {
            case "constant":
                params.constant = true;
                break;
            case "payable":
                params.payable = true;
                params.stateMutability = "payable";
                break;
            case "nonpayable":
                params.payable = false;
                params.stateMutability = "nonpayable";
                break;
            case "pure":
                params.constant = true;
                params.stateMutability = "pure";
                break;
            case "view":
                params.constant = true;
                params.stateMutability = "view";
                break;
            case "external":
            case "public":
            case "":
                break;
            default:
                console.log("unknown modifier: " + modifier);
        }
    });
}
function verifyState(value) {
    let result = {
        constant: false,
        payable: true,
        stateMutability: "payable"
    };
    if (value.stateMutability != null) {
        result.stateMutability = value.stateMutability;
        // Set (and check things are consistent) the constant property
        result.constant = (result.stateMutability === "view" || result.stateMutability === "pure");
        if (value.constant != null) {
            if ((!!value.constant) !== result.constant) {
                logger.throwArgumentError("cannot have constant function with mutability " + result.stateMutability, "value", value);
            }
        }
        // Set (and check things are consistent) the payable property
        result.payable = (result.stateMutability === "payable");
        if (value.payable != null) {
            if ((!!value.payable) !== result.payable) {
                logger.throwArgumentError("cannot have payable function with mutability " + result.stateMutability, "value", value);
            }
        }
    }
    else if (value.payable != null) {
        result.payable = !!value.payable;
        // If payable we can assume non-constant; otherwise we can't assume
        if (value.constant == null && !result.payable && value.type !== "constructor") {
            logger.throwArgumentError("unable to determine stateMutability", "value", value);
        }
        result.constant = !!value.constant;
        if (result.constant) {
            result.stateMutability = "view";
        }
        else {
            result.stateMutability = (result.payable ? "payable" : "nonpayable");
        }
        if (result.payable && result.constant) {
            logger.throwArgumentError("cannot have constant payable function", "value", value);
        }
    }
    else if (value.constant != null) {
        result.constant = !!value.constant;
        result.payable = !result.constant;
        result.stateMutability = (result.constant ? "view" : "payable");
    }
    else if (value.type !== "constructor") {
        logger.throwArgumentError("unable to determine stateMutability", "value", value);
    }
    return result;
}
class ConstructorFragment extends Fragment {
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            return JSON.stringify({
                type: "constructor",
                stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                payable: this.payable,
                gas: (this.gas ? this.gas.toNumber() : undefined),
                inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
            });
        }
        if (format === FormatTypes.sighash) {
            logger.throwError("cannot format a constructor for sighash", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "format(sighash)"
            });
        }
        let result = "constructor(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
        if (this.stateMutability && this.stateMutability !== "nonpayable") {
            result += this.stateMutability + " ";
        }
        return result.trim();
    }
    static from(value) {
        if (typeof (value) === "string") {
            return ConstructorFragment.fromString(value);
        }
        return ConstructorFragment.fromObject(value);
    }
    static fromObject(value) {
        if (ConstructorFragment.isConstructorFragment(value)) {
            return value;
        }
        if (value.type !== "constructor") {
            logger.throwArgumentError("invalid constructor object", "value", value);
        }
        let state = verifyState(value);
        if (state.constant) {
            logger.throwArgumentError("constructor cannot be constant", "value", value);
        }
        const params = {
            name: null,
            type: value.type,
            inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
            payable: state.payable,
            stateMutability: state.stateMutability,
            gas: (value.gas ? _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_3__.BigNumber.from(value.gas) : null)
        };
        return new ConstructorFragment(_constructorGuard, params);
    }
    static fromString(value) {
        let params = { type: "constructor" };
        value = parseGas(value, params);
        let parens = value.match(regexParen);
        if (!parens || parens[1].trim() !== "constructor") {
            logger.throwArgumentError("invalid constructor string", "value", value);
        }
        params.inputs = parseParams(parens[2].trim(), false);
        parseModifiers(parens[3].trim(), params);
        return ConstructorFragment.fromObject(params);
    }
    static isConstructorFragment(value) {
        return (value && value._isFragment && value.type === "constructor");
    }
}
class FunctionFragment extends ConstructorFragment {
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            return JSON.stringify({
                type: "function",
                name: this.name,
                constant: this.constant,
                stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                payable: this.payable,
                gas: (this.gas ? this.gas.toNumber() : undefined),
                inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
                outputs: this.outputs.map((output) => JSON.parse(output.format(format))),
            });
        }
        let result = "";
        if (format !== FormatTypes.sighash) {
            result += "function ";
        }
        result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
        if (format !== FormatTypes.sighash) {
            if (this.stateMutability) {
                if (this.stateMutability !== "nonpayable") {
                    result += (this.stateMutability + " ");
                }
            }
            else if (this.constant) {
                result += "view ";
            }
            if (this.outputs && this.outputs.length) {
                result += "returns (" + this.outputs.map((output) => output.format(format)).join(", ") + ") ";
            }
            if (this.gas != null) {
                result += "@" + this.gas.toString() + " ";
            }
        }
        return result.trim();
    }
    static from(value) {
        if (typeof (value) === "string") {
            return FunctionFragment.fromString(value);
        }
        return FunctionFragment.fromObject(value);
    }
    static fromObject(value) {
        if (FunctionFragment.isFunctionFragment(value)) {
            return value;
        }
        if (value.type !== "function") {
            logger.throwArgumentError("invalid function object", "value", value);
        }
        let state = verifyState(value);
        const params = {
            type: value.type,
            name: verifyIdentifier(value.name),
            constant: state.constant,
            inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
            outputs: (value.outputs ? value.outputs.map(ParamType.fromObject) : []),
            payable: state.payable,
            stateMutability: state.stateMutability,
            gas: (value.gas ? _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_3__.BigNumber.from(value.gas) : null)
        };
        return new FunctionFragment(_constructorGuard, params);
    }
    static fromString(value) {
        let params = { type: "function" };
        value = parseGas(value, params);
        let comps = value.split(" returns ");
        if (comps.length > 2) {
            logger.throwArgumentError("invalid function string", "value", value);
        }
        let parens = comps[0].match(regexParen);
        if (!parens) {
            logger.throwArgumentError("invalid function signature", "value", value);
        }
        params.name = parens[1].trim();
        if (params.name) {
            verifyIdentifier(params.name);
        }
        params.inputs = parseParams(parens[2], false);
        parseModifiers(parens[3].trim(), params);
        // We have outputs
        if (comps.length > 1) {
            let returns = comps[1].match(regexParen);
            if (returns[1].trim() != "" || returns[3].trim() != "") {
                logger.throwArgumentError("unexpected tokens", "value", value);
            }
            params.outputs = parseParams(returns[2], false);
        }
        else {
            params.outputs = [];
        }
        return FunctionFragment.fromObject(params);
    }
    static isFunctionFragment(value) {
        return (value && value._isFragment && value.type === "function");
    }
}
//export class StructFragment extends Fragment {
//}
function checkForbidden(fragment) {
    const sig = fragment.format();
    if (sig === "Error(string)" || sig === "Panic(uint256)") {
        logger.throwArgumentError(`cannot specify user defined ${sig} error`, "fragment", fragment);
    }
    return fragment;
}
class ErrorFragment extends Fragment {
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            return JSON.stringify({
                type: "error",
                name: this.name,
                inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
            });
        }
        let result = "";
        if (format !== FormatTypes.sighash) {
            result += "error ";
        }
        result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
        return result.trim();
    }
    static from(value) {
        if (typeof (value) === "string") {
            return ErrorFragment.fromString(value);
        }
        return ErrorFragment.fromObject(value);
    }
    static fromObject(value) {
        if (ErrorFragment.isErrorFragment(value)) {
            return value;
        }
        if (value.type !== "error") {
            logger.throwArgumentError("invalid error object", "value", value);
        }
        const params = {
            type: value.type,
            name: verifyIdentifier(value.name),
            inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : [])
        };
        return checkForbidden(new ErrorFragment(_constructorGuard, params));
    }
    static fromString(value) {
        let params = { type: "error" };
        let parens = value.match(regexParen);
        if (!parens) {
            logger.throwArgumentError("invalid error signature", "value", value);
        }
        params.name = parens[1].trim();
        if (params.name) {
            verifyIdentifier(params.name);
        }
        params.inputs = parseParams(parens[2], false);
        return checkForbidden(ErrorFragment.fromObject(params));
    }
    static isErrorFragment(value) {
        return (value && value._isFragment && value.type === "error");
    }
}
function verifyType(type) {
    // These need to be transformed to their full description
    if (type.match(/^uint($|[^1-9])/)) {
        type = "uint256" + type.substring(4);
    }
    else if (type.match(/^int($|[^1-9])/)) {
        type = "int256" + type.substring(3);
    }
    // @TODO: more verification
    return type;
}
// See: https://github.com/ethereum/solidity/blob/1f8f1a3db93a548d0555e3e14cfc55a10e25b60e/docs/grammar/SolidityLexer.g4#L234
const regexIdentifier = new RegExp("^[a-zA-Z$_][a-zA-Z0-9$_]*$");
function verifyIdentifier(value) {
    if (!value || !value.match(regexIdentifier)) {
        logger.throwArgumentError(`invalid identifier "${value}"`, "value", value);
    }
    return value;
}
const regexParen = new RegExp("^([^)(]*)\\((.*)\\)([^)(]*)$");
function splitNesting(value) {
    value = value.trim();
    let result = [];
    let accum = "";
    let depth = 0;
    for (let offset = 0; offset < value.length; offset++) {
        let c = value[offset];
        if (c === "," && depth === 0) {
            result.push(accum);
            accum = "";
        }
        else {
            accum += c;
            if (c === "(") {
                depth++;
            }
            else if (c === ")") {
                depth--;
                if (depth === -1) {
                    logger.throwArgumentError("unbalanced parenthesis", "value", value);
                }
            }
        }
    }
    if (accum) {
        result.push(accum);
    }
    return result;
}
//# sourceMappingURL=fragments.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abi/lib.esm/interface.js":
/*!**************************************************************!*\
  !*** ./node_modules/@ethersproject/abi/lib.esm/interface.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ErrorDescription": () => (/* binding */ ErrorDescription),
/* harmony export */   "Indexed": () => (/* binding */ Indexed),
/* harmony export */   "Interface": () => (/* binding */ Interface),
/* harmony export */   "LogDescription": () => (/* binding */ LogDescription),
/* harmony export */   "TransactionDescription": () => (/* binding */ TransactionDescription),
/* harmony export */   "checkResultErrors": () => (/* reexport safe */ _coders_abstract_coder__WEBPACK_IMPORTED_MODULE_2__.checkResultErrors)
/* harmony export */ });
/* harmony import */ var _ethersproject_address__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @ethersproject/address */ "./node_modules/@ethersproject/address/lib.esm/index.js");
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @ethersproject/bignumber */ "./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js");
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_hash__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @ethersproject/hash */ "./node_modules/@ethersproject/hash/lib.esm/id.js");
/* harmony import */ var _ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @ethersproject/keccak256 */ "./node_modules/@ethersproject/keccak256/lib.esm/index.js");
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @ethersproject/properties */ "./node_modules/@ethersproject/properties/lib.esm/index.js");
/* harmony import */ var _abi_coder__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./abi-coder */ "./node_modules/@ethersproject/abi/lib.esm/abi-coder.js");
/* harmony import */ var _coders_abstract_coder__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./coders/abstract-coder */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");
/* harmony import */ var _fragments__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./fragments */ "./node_modules/@ethersproject/abi/lib.esm/fragments.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/abi/lib.esm/_version.js");












const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);

class LogDescription extends _ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.Description {
}
class TransactionDescription extends _ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.Description {
}
class ErrorDescription extends _ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.Description {
}
class Indexed extends _ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.Description {
    static isIndexed(value) {
        return !!(value && value._isIndexed);
    }
}
const BuiltinErrors = {
    "0x08c379a0": { signature: "Error(string)", name: "Error", inputs: ["string"], reason: true },
    "0x4e487b71": { signature: "Panic(uint256)", name: "Panic", inputs: ["uint256"] }
};
function wrapAccessError(property, error) {
    const wrap = new Error(`deferred error during ABI decoding triggered accessing ${property}`);
    wrap.error = error;
    return wrap;
}
/*
function checkNames(fragment: Fragment, type: "input" | "output", params: Array<ParamType>): void {
    params.reduce((accum, param) => {
        if (param.name) {
            if (accum[param.name]) {
                logger.throwArgumentError(`duplicate ${ type } parameter ${ JSON.stringify(param.name) } in ${ fragment.format("full") }`, "fragment", fragment);
            }
            accum[param.name] = true;
        }
        return accum;
    }, <{ [ name: string ]: boolean }>{ });
}
*/
class Interface {
    constructor(fragments) {
        let abi = [];
        if (typeof (fragments) === "string") {
            abi = JSON.parse(fragments);
        }
        else {
            abi = fragments;
        }
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "fragments", abi.map((fragment) => {
            return _fragments__WEBPACK_IMPORTED_MODULE_4__.Fragment.from(fragment);
        }).filter((fragment) => (fragment != null)));
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "_abiCoder", (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.getStatic)(new.target, "getAbiCoder")());
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "functions", {});
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "errors", {});
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "events", {});
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "structs", {});
        // Add all fragments by their signature
        this.fragments.forEach((fragment) => {
            let bucket = null;
            switch (fragment.type) {
                case "constructor":
                    if (this.deploy) {
                        logger.warn("duplicate definition - constructor");
                        return;
                    }
                    //checkNames(fragment, "input", fragment.inputs);
                    (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "deploy", fragment);
                    return;
                case "function":
                    //checkNames(fragment, "input", fragment.inputs);
                    //checkNames(fragment, "output", (<FunctionFragment>fragment).outputs);
                    bucket = this.functions;
                    break;
                case "event":
                    //checkNames(fragment, "input", fragment.inputs);
                    bucket = this.events;
                    break;
                case "error":
                    bucket = this.errors;
                    break;
                default:
                    return;
            }
            let signature = fragment.format();
            if (bucket[signature]) {
                logger.warn("duplicate definition - " + signature);
                return;
            }
            bucket[signature] = fragment;
        });
        // If we do not have a constructor add a default
        if (!this.deploy) {
            (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "deploy", _fragments__WEBPACK_IMPORTED_MODULE_4__.ConstructorFragment.from({
                payable: false,
                type: "constructor"
            }));
        }
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "_isInterface", true);
    }
    format(format) {
        if (!format) {
            format = _fragments__WEBPACK_IMPORTED_MODULE_4__.FormatTypes.full;
        }
        if (format === _fragments__WEBPACK_IMPORTED_MODULE_4__.FormatTypes.sighash) {
            logger.throwArgumentError("interface does not support formatting sighash", "format", format);
        }
        const abi = this.fragments.map((fragment) => fragment.format(format));
        // We need to re-bundle the JSON fragments a bit
        if (format === _fragments__WEBPACK_IMPORTED_MODULE_4__.FormatTypes.json) {
            return JSON.stringify(abi.map((j) => JSON.parse(j)));
        }
        return abi;
    }
    // Sub-classes can override these to handle other blockchains
    static getAbiCoder() {
        return _abi_coder__WEBPACK_IMPORTED_MODULE_5__.defaultAbiCoder;
    }
    static getAddress(address) {
        return (0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_6__.getAddress)(address);
    }
    static getSighash(fragment) {
        return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexDataSlice)((0,_ethersproject_hash__WEBPACK_IMPORTED_MODULE_8__.id)(fragment.format()), 0, 4);
    }
    static getEventTopic(eventFragment) {
        return (0,_ethersproject_hash__WEBPACK_IMPORTED_MODULE_8__.id)(eventFragment.format());
    }
    // Find a function definition by any means necessary (unless it is ambiguous)
    getFunction(nameOrSignatureOrSighash) {
        if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.isHexString)(nameOrSignatureOrSighash)) {
            for (const name in this.functions) {
                if (nameOrSignatureOrSighash === this.getSighash(name)) {
                    return this.functions[name];
                }
            }
            logger.throwArgumentError("no matching function", "sighash", nameOrSignatureOrSighash);
        }
        // It is a bare name, look up the function (will return null if ambiguous)
        if (nameOrSignatureOrSighash.indexOf("(") === -1) {
            const name = nameOrSignatureOrSighash.trim();
            const matching = Object.keys(this.functions).filter((f) => (f.split("(" /* fix:) */)[0] === name));
            if (matching.length === 0) {
                logger.throwArgumentError("no matching function", "name", name);
            }
            else if (matching.length > 1) {
                logger.throwArgumentError("multiple matching functions", "name", name);
            }
            return this.functions[matching[0]];
        }
        // Normalize the signature and lookup the function
        const result = this.functions[_fragments__WEBPACK_IMPORTED_MODULE_4__.FunctionFragment.fromString(nameOrSignatureOrSighash).format()];
        if (!result) {
            logger.throwArgumentError("no matching function", "signature", nameOrSignatureOrSighash);
        }
        return result;
    }
    // Find an event definition by any means necessary (unless it is ambiguous)
    getEvent(nameOrSignatureOrTopic) {
        if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.isHexString)(nameOrSignatureOrTopic)) {
            const topichash = nameOrSignatureOrTopic.toLowerCase();
            for (const name in this.events) {
                if (topichash === this.getEventTopic(name)) {
                    return this.events[name];
                }
            }
            logger.throwArgumentError("no matching event", "topichash", topichash);
        }
        // It is a bare name, look up the function (will return null if ambiguous)
        if (nameOrSignatureOrTopic.indexOf("(") === -1) {
            const name = nameOrSignatureOrTopic.trim();
            const matching = Object.keys(this.events).filter((f) => (f.split("(" /* fix:) */)[0] === name));
            if (matching.length === 0) {
                logger.throwArgumentError("no matching event", "name", name);
            }
            else if (matching.length > 1) {
                logger.throwArgumentError("multiple matching events", "name", name);
            }
            return this.events[matching[0]];
        }
        // Normalize the signature and lookup the function
        const result = this.events[_fragments__WEBPACK_IMPORTED_MODULE_4__.EventFragment.fromString(nameOrSignatureOrTopic).format()];
        if (!result) {
            logger.throwArgumentError("no matching event", "signature", nameOrSignatureOrTopic);
        }
        return result;
    }
    // Find a function definition by any means necessary (unless it is ambiguous)
    getError(nameOrSignatureOrSighash) {
        if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.isHexString)(nameOrSignatureOrSighash)) {
            const getSighash = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.getStatic)(this.constructor, "getSighash");
            for (const name in this.errors) {
                const error = this.errors[name];
                if (nameOrSignatureOrSighash === getSighash(error)) {
                    return this.errors[name];
                }
            }
            logger.throwArgumentError("no matching error", "sighash", nameOrSignatureOrSighash);
        }
        // It is a bare name, look up the function (will return null if ambiguous)
        if (nameOrSignatureOrSighash.indexOf("(") === -1) {
            const name = nameOrSignatureOrSighash.trim();
            const matching = Object.keys(this.errors).filter((f) => (f.split("(" /* fix:) */)[0] === name));
            if (matching.length === 0) {
                logger.throwArgumentError("no matching error", "name", name);
            }
            else if (matching.length > 1) {
                logger.throwArgumentError("multiple matching errors", "name", name);
            }
            return this.errors[matching[0]];
        }
        // Normalize the signature and lookup the function
        const result = this.errors[_fragments__WEBPACK_IMPORTED_MODULE_4__.FunctionFragment.fromString(nameOrSignatureOrSighash).format()];
        if (!result) {
            logger.throwArgumentError("no matching error", "signature", nameOrSignatureOrSighash);
        }
        return result;
    }
    // Get the sighash (the bytes4 selector) used by Solidity to identify a function
    getSighash(fragment) {
        if (typeof (fragment) === "string") {
            try {
                fragment = this.getFunction(fragment);
            }
            catch (error) {
                try {
                    fragment = this.getError(fragment);
                }
                catch (_) {
                    throw error;
                }
            }
        }
        return (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.getStatic)(this.constructor, "getSighash")(fragment);
    }
    // Get the topic (the bytes32 hash) used by Solidity to identify an event
    getEventTopic(eventFragment) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        return (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.getStatic)(this.constructor, "getEventTopic")(eventFragment);
    }
    _decodeParams(params, data) {
        return this._abiCoder.decode(params, data);
    }
    _encodeParams(params, values) {
        return this._abiCoder.encode(params, values);
    }
    encodeDeploy(values) {
        return this._encodeParams(this.deploy.inputs, values || []);
    }
    decodeErrorResult(fragment, data) {
        if (typeof (fragment) === "string") {
            fragment = this.getError(fragment);
        }
        const bytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.arrayify)(data);
        if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)(bytes.slice(0, 4)) !== this.getSighash(fragment)) {
            logger.throwArgumentError(`data signature does not match error ${fragment.name}.`, "data", (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)(bytes));
        }
        return this._decodeParams(fragment.inputs, bytes.slice(4));
    }
    encodeErrorResult(fragment, values) {
        if (typeof (fragment) === "string") {
            fragment = this.getError(fragment);
        }
        return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.concat)([
            this.getSighash(fragment),
            this._encodeParams(fragment.inputs, values || [])
        ]));
    }
    // Decode the data for a function call (e.g. tx.data)
    decodeFunctionData(functionFragment, data) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        const bytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.arrayify)(data);
        if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)(bytes.slice(0, 4)) !== this.getSighash(functionFragment)) {
            logger.throwArgumentError(`data signature does not match function ${functionFragment.name}.`, "data", (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)(bytes));
        }
        return this._decodeParams(functionFragment.inputs, bytes.slice(4));
    }
    // Encode the data for a function call (e.g. tx.data)
    encodeFunctionData(functionFragment, values) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.concat)([
            this.getSighash(functionFragment),
            this._encodeParams(functionFragment.inputs, values || [])
        ]));
    }
    // Decode the result from a function call (e.g. from eth_call)
    decodeFunctionResult(functionFragment, data) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        let bytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.arrayify)(data);
        let reason = null;
        let message = "";
        let errorArgs = null;
        let errorName = null;
        let errorSignature = null;
        switch (bytes.length % this._abiCoder._getWordSize()) {
            case 0:
                try {
                    return this._abiCoder.decode(functionFragment.outputs, bytes);
                }
                catch (error) { }
                break;
            case 4: {
                const selector = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)(bytes.slice(0, 4));
                const builtin = BuiltinErrors[selector];
                if (builtin) {
                    errorArgs = this._abiCoder.decode(builtin.inputs, bytes.slice(4));
                    errorName = builtin.name;
                    errorSignature = builtin.signature;
                    if (builtin.reason) {
                        reason = errorArgs[0];
                    }
                    if (errorName === "Error") {
                        message = `; VM Exception while processing transaction: reverted with reason string ${JSON.stringify(errorArgs[0])}`;
                    }
                    else if (errorName === "Panic") {
                        message = `; VM Exception while processing transaction: reverted with panic code ${errorArgs[0]}`;
                    }
                }
                else {
                    try {
                        const error = this.getError(selector);
                        errorArgs = this._abiCoder.decode(error.inputs, bytes.slice(4));
                        errorName = error.name;
                        errorSignature = error.format();
                    }
                    catch (error) { }
                }
                break;
            }
        }
        return logger.throwError("call revert exception" + message, _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.CALL_EXCEPTION, {
            method: functionFragment.format(),
            data: (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)(data), errorArgs, errorName, errorSignature, reason
        });
    }
    // Encode the result for a function call (e.g. for eth_call)
    encodeFunctionResult(functionFragment, values) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)(this._abiCoder.encode(functionFragment.outputs, values || []));
    }
    // Create the filter for the event with search criteria (e.g. for eth_filterLog)
    encodeFilterTopics(eventFragment, values) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        if (values.length > eventFragment.inputs.length) {
            logger.throwError("too many arguments for " + eventFragment.format(), _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNEXPECTED_ARGUMENT, {
                argument: "values",
                value: values
            });
        }
        let topics = [];
        if (!eventFragment.anonymous) {
            topics.push(this.getEventTopic(eventFragment));
        }
        const encodeTopic = (param, value) => {
            if (param.type === "string") {
                return (0,_ethersproject_hash__WEBPACK_IMPORTED_MODULE_8__.id)(value);
            }
            else if (param.type === "bytes") {
                return (0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_9__.keccak256)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)(value));
            }
            if (param.type === "bool" && typeof (value) === "boolean") {
                value = (value ? "0x01" : "0x00");
            }
            if (param.type.match(/^u?int/)) {
                value = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_10__.BigNumber.from(value).toHexString();
            }
            // Check addresses are valid
            if (param.type === "address") {
                this._abiCoder.encode(["address"], [value]);
            }
            return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexZeroPad)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)(value), 32);
        };
        values.forEach((value, index) => {
            let param = eventFragment.inputs[index];
            if (!param.indexed) {
                if (value != null) {
                    logger.throwArgumentError("cannot filter non-indexed parameters; must be null", ("contract." + param.name), value);
                }
                return;
            }
            if (value == null) {
                topics.push(null);
            }
            else if (param.baseType === "array" || param.baseType === "tuple") {
                logger.throwArgumentError("filtering with tuples or arrays not supported", ("contract." + param.name), value);
            }
            else if (Array.isArray(value)) {
                topics.push(value.map((value) => encodeTopic(param, value)));
            }
            else {
                topics.push(encodeTopic(param, value));
            }
        });
        // Trim off trailing nulls
        while (topics.length && topics[topics.length - 1] === null) {
            topics.pop();
        }
        return topics;
    }
    encodeEventLog(eventFragment, values) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        const topics = [];
        const dataTypes = [];
        const dataValues = [];
        if (!eventFragment.anonymous) {
            topics.push(this.getEventTopic(eventFragment));
        }
        if (values.length !== eventFragment.inputs.length) {
            logger.throwArgumentError("event arguments/values mismatch", "values", values);
        }
        eventFragment.inputs.forEach((param, index) => {
            const value = values[index];
            if (param.indexed) {
                if (param.type === "string") {
                    topics.push((0,_ethersproject_hash__WEBPACK_IMPORTED_MODULE_8__.id)(value));
                }
                else if (param.type === "bytes") {
                    topics.push((0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_9__.keccak256)(value));
                }
                else if (param.baseType === "tuple" || param.baseType === "array") {
                    // @TODO
                    throw new Error("not implemented");
                }
                else {
                    topics.push(this._abiCoder.encode([param.type], [value]));
                }
            }
            else {
                dataTypes.push(param);
                dataValues.push(value);
            }
        });
        return {
            data: this._abiCoder.encode(dataTypes, dataValues),
            topics: topics
        };
    }
    // Decode a filter for the event and the search criteria
    decodeEventLog(eventFragment, data, topics) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        if (topics != null && !eventFragment.anonymous) {
            let topicHash = this.getEventTopic(eventFragment);
            if (!(0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.isHexString)(topics[0], 32) || topics[0].toLowerCase() !== topicHash) {
                logger.throwError("fragment/topic mismatch", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.INVALID_ARGUMENT, { argument: "topics[0]", expected: topicHash, value: topics[0] });
            }
            topics = topics.slice(1);
        }
        let indexed = [];
        let nonIndexed = [];
        let dynamic = [];
        eventFragment.inputs.forEach((param, index) => {
            if (param.indexed) {
                if (param.type === "string" || param.type === "bytes" || param.baseType === "tuple" || param.baseType === "array") {
                    indexed.push(_fragments__WEBPACK_IMPORTED_MODULE_4__.ParamType.fromObject({ type: "bytes32", name: param.name }));
                    dynamic.push(true);
                }
                else {
                    indexed.push(param);
                    dynamic.push(false);
                }
            }
            else {
                nonIndexed.push(param);
                dynamic.push(false);
            }
        });
        let resultIndexed = (topics != null) ? this._abiCoder.decode(indexed, (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.concat)(topics)) : null;
        let resultNonIndexed = this._abiCoder.decode(nonIndexed, data, true);
        let result = [];
        let nonIndexedIndex = 0, indexedIndex = 0;
        eventFragment.inputs.forEach((param, index) => {
            if (param.indexed) {
                if (resultIndexed == null) {
                    result[index] = new Indexed({ _isIndexed: true, hash: null });
                }
                else if (dynamic[index]) {
                    result[index] = new Indexed({ _isIndexed: true, hash: resultIndexed[indexedIndex++] });
                }
                else {
                    try {
                        result[index] = resultIndexed[indexedIndex++];
                    }
                    catch (error) {
                        result[index] = error;
                    }
                }
            }
            else {
                try {
                    result[index] = resultNonIndexed[nonIndexedIndex++];
                }
                catch (error) {
                    result[index] = error;
                }
            }
            // Add the keyword argument if named and safe
            if (param.name && result[param.name] == null) {
                const value = result[index];
                // Make error named values throw on access
                if (value instanceof Error) {
                    Object.defineProperty(result, param.name, {
                        enumerable: true,
                        get: () => { throw wrapAccessError(`property ${JSON.stringify(param.name)}`, value); }
                    });
                }
                else {
                    result[param.name] = value;
                }
            }
        });
        // Make all error indexed values throw on access
        for (let i = 0; i < result.length; i++) {
            const value = result[i];
            if (value instanceof Error) {
                Object.defineProperty(result, i, {
                    enumerable: true,
                    get: () => { throw wrapAccessError(`index ${i}`, value); }
                });
            }
        }
        return Object.freeze(result);
    }
    // Given a transaction, find the matching function fragment (if any) and
    // determine all its properties and call parameters
    parseTransaction(tx) {
        let fragment = this.getFunction(tx.data.substring(0, 10).toLowerCase());
        if (!fragment) {
            return null;
        }
        return new TransactionDescription({
            args: this._abiCoder.decode(fragment.inputs, "0x" + tx.data.substring(10)),
            functionFragment: fragment,
            name: fragment.name,
            signature: fragment.format(),
            sighash: this.getSighash(fragment),
            value: _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_10__.BigNumber.from(tx.value || "0"),
        });
    }
    // @TODO
    //parseCallResult(data: BytesLike): ??
    // Given an event log, find the matching event fragment (if any) and
    // determine all its properties and values
    parseLog(log) {
        let fragment = this.getEvent(log.topics[0]);
        if (!fragment || fragment.anonymous) {
            return null;
        }
        // @TODO: If anonymous, and the only method, and the input count matches, should we parse?
        //        Probably not, because just because it is the only event in the ABI does
        //        not mean we have the full ABI; maybe just a fragment?
        return new LogDescription({
            eventFragment: fragment,
            name: fragment.name,
            signature: fragment.format(),
            topic: this.getEventTopic(fragment),
            args: this.decodeEventLog(fragment, log.data, log.topics)
        });
    }
    parseError(data) {
        const hexData = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_7__.hexlify)(data);
        let fragment = this.getError(hexData.substring(0, 10).toLowerCase());
        if (!fragment) {
            return null;
        }
        return new ErrorDescription({
            args: this._abiCoder.decode(fragment.inputs, "0x" + hexData.substring(10)),
            errorFragment: fragment,
            name: fragment.name,
            signature: fragment.format(),
            sighash: this.getSighash(fragment),
        });
    }
    /*
    static from(value: Array<Fragment | string | JsonAbi> | string | Interface) {
        if (Interface.isInterface(value)) {
            return value;
        }
        if (typeof(value) === "string") {
            return new Interface(JSON.parse(value));
        }
        return new Interface(value);
    }
    */
    static isInterface(value) {
        return !!(value && value._isInterface);
    }
}
//# sourceMappingURL=interface.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abstract-provider/lib.esm/_version.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@ethersproject/abstract-provider/lib.esm/_version.js ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "abstract-provider/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abstract-provider/lib.esm/index.js":
/*!************************************************************************!*\
  !*** ./node_modules/@ethersproject/abstract-provider/lib.esm/index.js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BlockForkEvent": () => (/* binding */ BlockForkEvent),
/* harmony export */   "ForkEvent": () => (/* binding */ ForkEvent),
/* harmony export */   "Provider": () => (/* binding */ Provider),
/* harmony export */   "TransactionForkEvent": () => (/* binding */ TransactionForkEvent),
/* harmony export */   "TransactionOrderForkEvent": () => (/* binding */ TransactionOrderForkEvent)
/* harmony export */ });
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @ethersproject/bignumber */ "./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js");
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/properties */ "./node_modules/@ethersproject/properties/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/abstract-provider/lib.esm/_version.js");

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};





const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
;
;
//export type CallTransactionable = {
//    call(transaction: TransactionRequest): Promise<TransactionResponse>;
//};
class ForkEvent extends _ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.Description {
    static isForkEvent(value) {
        return !!(value && value._isForkEvent);
    }
}
class BlockForkEvent extends ForkEvent {
    constructor(blockHash, expiry) {
        if (!(0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.isHexString)(blockHash, 32)) {
            logger.throwArgumentError("invalid blockHash", "blockHash", blockHash);
        }
        super({
            _isForkEvent: true,
            _isBlockForkEvent: true,
            expiry: (expiry || 0),
            blockHash: blockHash
        });
    }
}
class TransactionForkEvent extends ForkEvent {
    constructor(hash, expiry) {
        if (!(0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.isHexString)(hash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "hash", hash);
        }
        super({
            _isForkEvent: true,
            _isTransactionForkEvent: true,
            expiry: (expiry || 0),
            hash: hash
        });
    }
}
class TransactionOrderForkEvent extends ForkEvent {
    constructor(beforeHash, afterHash, expiry) {
        if (!(0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.isHexString)(beforeHash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "beforeHash", beforeHash);
        }
        if (!(0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.isHexString)(afterHash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "afterHash", afterHash);
        }
        super({
            _isForkEvent: true,
            _isTransactionOrderForkEvent: true,
            expiry: (expiry || 0),
            beforeHash: beforeHash,
            afterHash: afterHash
        });
    }
}
///////////////////////////////
// Exported Abstracts
class Provider {
    constructor() {
        logger.checkAbstract(new.target, Provider);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.defineReadOnly)(this, "_isProvider", true);
    }
    getFeeData() {
        return __awaiter(this, void 0, void 0, function* () {
            const { block, gasPrice } = yield (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.resolveProperties)({
                block: this.getBlock("latest"),
                gasPrice: this.getGasPrice().catch((error) => {
                    // @TODO: Why is this now failing on Calaveras?
                    //console.log(error);
                    return null;
                })
            });
            let lastBaseFeePerGas = null, maxFeePerGas = null, maxPriorityFeePerGas = null;
            if (block && block.baseFeePerGas) {
                // We may want to compute this more accurately in the future,
                // using the formula "check if the base fee is correct".
                // See: https://eips.ethereum.org/EIPS/eip-1559
                lastBaseFeePerGas = block.baseFeePerGas;
                maxPriorityFeePerGas = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from("1500000000");
                maxFeePerGas = block.baseFeePerGas.mul(2).add(maxPriorityFeePerGas);
            }
            return { lastBaseFeePerGas, maxFeePerGas, maxPriorityFeePerGas, gasPrice };
        });
    }
    // Alias for "on"
    addListener(eventName, listener) {
        return this.on(eventName, listener);
    }
    // Alias for "off"
    removeListener(eventName, listener) {
        return this.off(eventName, listener);
    }
    static isProvider(value) {
        return !!(value && value._isProvider);
    }
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abstract-signer/lib.esm/_version.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@ethersproject/abstract-signer/lib.esm/_version.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "abstract-signer/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/abstract-signer/lib.esm/index.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@ethersproject/abstract-signer/lib.esm/index.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Signer": () => (/* binding */ Signer),
/* harmony export */   "VoidSigner": () => (/* binding */ VoidSigner)
/* harmony export */ });
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/properties */ "./node_modules/@ethersproject/properties/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/abstract-signer/lib.esm/_version.js");

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
const allowedTransactionKeys = [
    "accessList", "ccipReadEnabled", "chainId", "customData", "data", "from", "gasLimit", "gasPrice", "maxFeePerGas", "maxPriorityFeePerGas", "nonce", "to", "type", "value"
];
const forwardErrors = [
    _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.INSUFFICIENT_FUNDS,
    _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.NONCE_EXPIRED,
    _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.REPLACEMENT_UNDERPRICED,
];
;
;
class Signer {
    ///////////////////
    // Sub-classes MUST call super
    constructor() {
        logger.checkAbstract(new.target, Signer);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.defineReadOnly)(this, "_isSigner", true);
    }
    ///////////////////
    // Sub-classes MAY override these
    getBalance(blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getBalance");
            return yield this.provider.getBalance(this.getAddress(), blockTag);
        });
    }
    getTransactionCount(blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getTransactionCount");
            return yield this.provider.getTransactionCount(this.getAddress(), blockTag);
        });
    }
    // Populates "from" if unspecified, and estimates the gas for the transaction
    estimateGas(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("estimateGas");
            const tx = yield (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.resolveProperties)(this.checkTransaction(transaction));
            return yield this.provider.estimateGas(tx);
        });
    }
    // Populates "from" if unspecified, and calls with the transaction
    call(transaction, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("call");
            const tx = yield (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.resolveProperties)(this.checkTransaction(transaction));
            return yield this.provider.call(tx, blockTag);
        });
    }
    // Populates all fields in a transaction, signs it and sends it to the network
    sendTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("sendTransaction");
            const tx = yield this.populateTransaction(transaction);
            const signedTx = yield this.signTransaction(tx);
            return yield this.provider.sendTransaction(signedTx);
        });
    }
    getChainId() {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getChainId");
            const network = yield this.provider.getNetwork();
            return network.chainId;
        });
    }
    getGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getGasPrice");
            return yield this.provider.getGasPrice();
        });
    }
    getFeeData() {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getFeeData");
            return yield this.provider.getFeeData();
        });
    }
    resolveName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("resolveName");
            return yield this.provider.resolveName(name);
        });
    }
    // Checks a transaction does not contain invalid keys and if
    // no "from" is provided, populates it.
    // - does NOT require a provider
    // - adds "from" is not present
    // - returns a COPY (safe to mutate the result)
    // By default called from: (overriding these prevents it)
    //   - call
    //   - estimateGas
    //   - populateTransaction (and therefor sendTransaction)
    checkTransaction(transaction) {
        for (const key in transaction) {
            if (allowedTransactionKeys.indexOf(key) === -1) {
                logger.throwArgumentError("invalid transaction key: " + key, "transaction", transaction);
            }
        }
        const tx = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.shallowCopy)(transaction);
        if (tx.from == null) {
            tx.from = this.getAddress();
        }
        else {
            // Make sure any provided address matches this signer
            tx.from = Promise.all([
                Promise.resolve(tx.from),
                this.getAddress()
            ]).then((result) => {
                if (result[0].toLowerCase() !== result[1].toLowerCase()) {
                    logger.throwArgumentError("from address mismatch", "transaction", transaction);
                }
                return result[0];
            });
        }
        return tx;
    }
    // Populates ALL keys for a transaction and checks that "from" matches
    // this Signer. Should be used by sendTransaction but NOT by signTransaction.
    // By default called from: (overriding these prevents it)
    //   - sendTransaction
    //
    // Notes:
    //  - We allow gasPrice for EIP-1559 as long as it matches maxFeePerGas
    populateTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.resolveProperties)(this.checkTransaction(transaction));
            if (tx.to != null) {
                tx.to = Promise.resolve(tx.to).then((to) => __awaiter(this, void 0, void 0, function* () {
                    if (to == null) {
                        return null;
                    }
                    const address = yield this.resolveName(to);
                    if (address == null) {
                        logger.throwArgumentError("provided ENS name resolves to null", "tx.to", to);
                    }
                    return address;
                }));
                // Prevent this error from causing an UnhandledPromiseException
                tx.to.catch((error) => { });
            }
            // Do not allow mixing pre-eip-1559 and eip-1559 properties
            const hasEip1559 = (tx.maxFeePerGas != null || tx.maxPriorityFeePerGas != null);
            if (tx.gasPrice != null && (tx.type === 2 || hasEip1559)) {
                logger.throwArgumentError("eip-1559 transaction do not support gasPrice", "transaction", transaction);
            }
            else if ((tx.type === 0 || tx.type === 1) && hasEip1559) {
                logger.throwArgumentError("pre-eip-1559 transaction do not support maxFeePerGas/maxPriorityFeePerGas", "transaction", transaction);
            }
            if ((tx.type === 2 || tx.type == null) && (tx.maxFeePerGas != null && tx.maxPriorityFeePerGas != null)) {
                // Fully-formed EIP-1559 transaction (skip getFeeData)
                tx.type = 2;
            }
            else if (tx.type === 0 || tx.type === 1) {
                // Explicit Legacy or EIP-2930 transaction
                // Populate missing gasPrice
                if (tx.gasPrice == null) {
                    tx.gasPrice = this.getGasPrice();
                }
            }
            else {
                // We need to get fee data to determine things
                const feeData = yield this.getFeeData();
                if (tx.type == null) {
                    // We need to auto-detect the intended type of this transaction...
                    if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
                        // The network supports EIP-1559!
                        // Upgrade transaction from null to eip-1559
                        tx.type = 2;
                        if (tx.gasPrice != null) {
                            // Using legacy gasPrice property on an eip-1559 network,
                            // so use gasPrice as both fee properties
                            const gasPrice = tx.gasPrice;
                            delete tx.gasPrice;
                            tx.maxFeePerGas = gasPrice;
                            tx.maxPriorityFeePerGas = gasPrice;
                        }
                        else {
                            // Populate missing fee data
                            if (tx.maxFeePerGas == null) {
                                tx.maxFeePerGas = feeData.maxFeePerGas;
                            }
                            if (tx.maxPriorityFeePerGas == null) {
                                tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                            }
                        }
                    }
                    else if (feeData.gasPrice != null) {
                        // Network doesn't support EIP-1559...
                        // ...but they are trying to use EIP-1559 properties
                        if (hasEip1559) {
                            logger.throwError("network does not support EIP-1559", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                                operation: "populateTransaction"
                            });
                        }
                        // Populate missing fee data
                        if (tx.gasPrice == null) {
                            tx.gasPrice = feeData.gasPrice;
                        }
                        // Explicitly set untyped transaction to legacy
                        tx.type = 0;
                    }
                    else {
                        // getFeeData has failed us.
                        logger.throwError("failed to get consistent fee data", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                            operation: "signer.getFeeData"
                        });
                    }
                }
                else if (tx.type === 2) {
                    // Explicitly using EIP-1559
                    // Populate missing fee data
                    if (tx.maxFeePerGas == null) {
                        tx.maxFeePerGas = feeData.maxFeePerGas;
                    }
                    if (tx.maxPriorityFeePerGas == null) {
                        tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                    }
                }
            }
            if (tx.nonce == null) {
                tx.nonce = this.getTransactionCount("pending");
            }
            if (tx.gasLimit == null) {
                tx.gasLimit = this.estimateGas(tx).catch((error) => {
                    if (forwardErrors.indexOf(error.code) >= 0) {
                        throw error;
                    }
                    return logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
                        error: error,
                        tx: tx
                    });
                });
            }
            if (tx.chainId == null) {
                tx.chainId = this.getChainId();
            }
            else {
                tx.chainId = Promise.all([
                    Promise.resolve(tx.chainId),
                    this.getChainId()
                ]).then((results) => {
                    if (results[1] !== 0 && results[0] !== results[1]) {
                        logger.throwArgumentError("chainId address mismatch", "transaction", transaction);
                    }
                    return results[0];
                });
            }
            return yield (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.resolveProperties)(tx);
        });
    }
    ///////////////////
    // Sub-classes SHOULD leave these alone
    _checkProvider(operation) {
        if (!this.provider) {
            logger.throwError("missing provider", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: (operation || "_checkProvider")
            });
        }
    }
    static isSigner(value) {
        return !!(value && value._isSigner);
    }
}
class VoidSigner extends Signer {
    constructor(address, provider) {
        super();
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.defineReadOnly)(this, "address", address);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__.defineReadOnly)(this, "provider", provider || null);
    }
    getAddress() {
        return Promise.resolve(this.address);
    }
    _fail(message, operation) {
        return Promise.resolve().then(() => {
            logger.throwError(message, _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, { operation: operation });
        });
    }
    signMessage(message) {
        return this._fail("VoidSigner cannot sign messages", "signMessage");
    }
    signTransaction(transaction) {
        return this._fail("VoidSigner cannot sign transactions", "signTransaction");
    }
    _signTypedData(domain, types, value) {
        return this._fail("VoidSigner cannot sign typed data", "signTypedData");
    }
    connect(provider) {
        return new VoidSigner(this.address, provider);
    }
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/address/lib.esm/_version.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@ethersproject/address/lib.esm/_version.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "address/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/address/lib.esm/index.js":
/*!**************************************************************!*\
  !*** ./node_modules/@ethersproject/address/lib.esm/index.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getAddress": () => (/* binding */ getAddress),
/* harmony export */   "getContractAddress": () => (/* binding */ getContractAddress),
/* harmony export */   "getCreate2Address": () => (/* binding */ getCreate2Address),
/* harmony export */   "getIcapAddress": () => (/* binding */ getIcapAddress),
/* harmony export */   "isAddress": () => (/* binding */ isAddress)
/* harmony export */ });
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @ethersproject/bignumber */ "./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js");
/* harmony import */ var _ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @ethersproject/keccak256 */ "./node_modules/@ethersproject/keccak256/lib.esm/index.js");
/* harmony import */ var _ethersproject_rlp__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @ethersproject/rlp */ "./node_modules/@ethersproject/rlp/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/address/lib.esm/_version.js");







const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
function getChecksumAddress(address) {
    if (!(0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.isHexString)(address, 20)) {
        logger.throwArgumentError("invalid address", "address", address);
    }
    address = address.toLowerCase();
    const chars = address.substring(2).split("");
    const expanded = new Uint8Array(40);
    for (let i = 0; i < 40; i++) {
        expanded[i] = chars[i].charCodeAt(0);
    }
    const hashed = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.arrayify)((0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_3__.keccak256)(expanded));
    for (let i = 0; i < 40; i += 2) {
        if ((hashed[i >> 1] >> 4) >= 8) {
            chars[i] = chars[i].toUpperCase();
        }
        if ((hashed[i >> 1] & 0x0f) >= 8) {
            chars[i + 1] = chars[i + 1].toUpperCase();
        }
    }
    return "0x" + chars.join("");
}
// Shims for environments that are missing some required constants and functions
const MAX_SAFE_INTEGER = 0x1fffffffffffff;
function log10(x) {
    if (Math.log10) {
        return Math.log10(x);
    }
    return Math.log(x) / Math.LN10;
}
// See: https://en.wikipedia.org/wiki/International_Bank_Account_Number
// Create lookup table
const ibanLookup = {};
for (let i = 0; i < 10; i++) {
    ibanLookup[String(i)] = String(i);
}
for (let i = 0; i < 26; i++) {
    ibanLookup[String.fromCharCode(65 + i)] = String(10 + i);
}
// How many decimal digits can we process? (for 64-bit float, this is 15)
const safeDigits = Math.floor(log10(MAX_SAFE_INTEGER));
function ibanChecksum(address) {
    address = address.toUpperCase();
    address = address.substring(4) + address.substring(0, 2) + "00";
    let expanded = address.split("").map((c) => { return ibanLookup[c]; }).join("");
    // Javascript can handle integers safely up to 15 (decimal) digits
    while (expanded.length >= safeDigits) {
        let block = expanded.substring(0, safeDigits);
        expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
    }
    let checksum = String(98 - (parseInt(expanded, 10) % 97));
    while (checksum.length < 2) {
        checksum = "0" + checksum;
    }
    return checksum;
}
;
function getAddress(address) {
    let result = null;
    if (typeof (address) !== "string") {
        logger.throwArgumentError("invalid address", "address", address);
    }
    if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
        // Missing the 0x prefix
        if (address.substring(0, 2) !== "0x") {
            address = "0x" + address;
        }
        result = getChecksumAddress(address);
        // It is a checksummed address with a bad checksum
        if (address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) && result !== address) {
            logger.throwArgumentError("bad address checksum", "address", address);
        }
        // Maybe ICAP? (we only support direct mode)
    }
    else if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
        // It is an ICAP address with a bad checksum
        if (address.substring(2, 4) !== ibanChecksum(address)) {
            logger.throwArgumentError("bad icap checksum", "address", address);
        }
        result = (0,_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__._base36To16)(address.substring(4));
        while (result.length < 40) {
            result = "0" + result;
        }
        result = getChecksumAddress("0x" + result);
    }
    else {
        logger.throwArgumentError("invalid address", "address", address);
    }
    return result;
}
function isAddress(address) {
    try {
        getAddress(address);
        return true;
    }
    catch (error) { }
    return false;
}
function getIcapAddress(address) {
    let base36 = (0,_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__._base16To36)(getAddress(address).substring(2)).toUpperCase();
    while (base36.length < 30) {
        base36 = "0" + base36;
    }
    return "XE" + ibanChecksum("XE00" + base36) + base36;
}
// http://ethereum.stackexchange.com/questions/760/how-is-the-address-of-an-ethereum-contract-computed
function getContractAddress(transaction) {
    let from = null;
    try {
        from = getAddress(transaction.from);
    }
    catch (error) {
        logger.throwArgumentError("missing from address", "transaction", transaction);
    }
    const nonce = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.stripZeros)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.arrayify)(_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(transaction.nonce).toHexString()));
    return getAddress((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.hexDataSlice)((0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_3__.keccak256)((0,_ethersproject_rlp__WEBPACK_IMPORTED_MODULE_5__.encode)([from, nonce])), 12));
}
function getCreate2Address(from, salt, initCodeHash) {
    if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.hexDataLength)(salt) !== 32) {
        logger.throwArgumentError("salt must be 32 bytes", "salt", salt);
    }
    if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.hexDataLength)(initCodeHash) !== 32) {
        logger.throwArgumentError("initCodeHash must be 32 bytes", "initCodeHash", initCodeHash);
    }
    return getAddress((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.hexDataSlice)((0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_3__.keccak256)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.concat)(["0xff", getAddress(from), salt, initCodeHash])), 12));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/bignumber/lib.esm/_version.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@ethersproject/bignumber/lib.esm/_version.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "bignumber/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js":
/*!********************************************************************!*\
  !*** ./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BigNumber": () => (/* binding */ BigNumber),
/* harmony export */   "_base16To36": () => (/* binding */ _base16To36),
/* harmony export */   "_base36To16": () => (/* binding */ _base36To16),
/* harmony export */   "isBigNumberish": () => (/* binding */ isBigNumberish)
/* harmony export */ });
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! bn.js */ "./node_modules/bn.js/lib/bn.js");
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(bn_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/bignumber/lib.esm/_version.js");

/**
 *  BigNumber
 *
 *  A wrapper around the BN.js object. We use the BN.js library
 *  because it is used by elliptic, so it is required regardless.
 *
 */

var BN = (bn_js__WEBPACK_IMPORTED_MODULE_0___default().BN);



const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_1__.Logger(_version__WEBPACK_IMPORTED_MODULE_2__.version);
const _constructorGuard = {};
const MAX_SAFE = 0x1fffffffffffff;
function isBigNumberish(value) {
    return (value != null) && (BigNumber.isBigNumber(value) ||
        (typeof (value) === "number" && (value % 1) === 0) ||
        (typeof (value) === "string" && !!value.match(/^-?[0-9]+$/)) ||
        (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.isHexString)(value) ||
        (typeof (value) === "bigint") ||
        (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.isBytes)(value));
}
// Only warn about passing 10 into radix once
let _warnedToStringRadix = false;
class BigNumber {
    constructor(constructorGuard, hex) {
        if (constructorGuard !== _constructorGuard) {
            logger.throwError("cannot call constructor directly; use BigNumber.from", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_1__.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "new (BigNumber)"
            });
        }
        this._hex = hex;
        this._isBigNumber = true;
        Object.freeze(this);
    }
    fromTwos(value) {
        return toBigNumber(toBN(this).fromTwos(value));
    }
    toTwos(value) {
        return toBigNumber(toBN(this).toTwos(value));
    }
    abs() {
        if (this._hex[0] === "-") {
            return BigNumber.from(this._hex.substring(1));
        }
        return this;
    }
    add(other) {
        return toBigNumber(toBN(this).add(toBN(other)));
    }
    sub(other) {
        return toBigNumber(toBN(this).sub(toBN(other)));
    }
    div(other) {
        const o = BigNumber.from(other);
        if (o.isZero()) {
            throwFault("division-by-zero", "div");
        }
        return toBigNumber(toBN(this).div(toBN(other)));
    }
    mul(other) {
        return toBigNumber(toBN(this).mul(toBN(other)));
    }
    mod(other) {
        const value = toBN(other);
        if (value.isNeg()) {
            throwFault("division-by-zero", "mod");
        }
        return toBigNumber(toBN(this).umod(value));
    }
    pow(other) {
        const value = toBN(other);
        if (value.isNeg()) {
            throwFault("negative-power", "pow");
        }
        return toBigNumber(toBN(this).pow(value));
    }
    and(other) {
        const value = toBN(other);
        if (this.isNegative() || value.isNeg()) {
            throwFault("unbound-bitwise-result", "and");
        }
        return toBigNumber(toBN(this).and(value));
    }
    or(other) {
        const value = toBN(other);
        if (this.isNegative() || value.isNeg()) {
            throwFault("unbound-bitwise-result", "or");
        }
        return toBigNumber(toBN(this).or(value));
    }
    xor(other) {
        const value = toBN(other);
        if (this.isNegative() || value.isNeg()) {
            throwFault("unbound-bitwise-result", "xor");
        }
        return toBigNumber(toBN(this).xor(value));
    }
    mask(value) {
        if (this.isNegative() || value < 0) {
            throwFault("negative-width", "mask");
        }
        return toBigNumber(toBN(this).maskn(value));
    }
    shl(value) {
        if (this.isNegative() || value < 0) {
            throwFault("negative-width", "shl");
        }
        return toBigNumber(toBN(this).shln(value));
    }
    shr(value) {
        if (this.isNegative() || value < 0) {
            throwFault("negative-width", "shr");
        }
        return toBigNumber(toBN(this).shrn(value));
    }
    eq(other) {
        return toBN(this).eq(toBN(other));
    }
    lt(other) {
        return toBN(this).lt(toBN(other));
    }
    lte(other) {
        return toBN(this).lte(toBN(other));
    }
    gt(other) {
        return toBN(this).gt(toBN(other));
    }
    gte(other) {
        return toBN(this).gte(toBN(other));
    }
    isNegative() {
        return (this._hex[0] === "-");
    }
    isZero() {
        return toBN(this).isZero();
    }
    toNumber() {
        try {
            return toBN(this).toNumber();
        }
        catch (error) {
            throwFault("overflow", "toNumber", this.toString());
        }
        return null;
    }
    toBigInt() {
        try {
            return BigInt(this.toString());
        }
        catch (e) { }
        return logger.throwError("this platform does not support BigInt", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_1__.Logger.errors.UNSUPPORTED_OPERATION, {
            value: this.toString()
        });
    }
    toString() {
        // Lots of people expect this, which we do not support, so check (See: #889)
        if (arguments.length > 0) {
            if (arguments[0] === 10) {
                if (!_warnedToStringRadix) {
                    _warnedToStringRadix = true;
                    logger.warn("BigNumber.toString does not accept any parameters; base-10 is assumed");
                }
            }
            else if (arguments[0] === 16) {
                logger.throwError("BigNumber.toString does not accept any parameters; use bigNumber.toHexString()", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_1__.Logger.errors.UNEXPECTED_ARGUMENT, {});
            }
            else {
                logger.throwError("BigNumber.toString does not accept parameters", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_1__.Logger.errors.UNEXPECTED_ARGUMENT, {});
            }
        }
        return toBN(this).toString(10);
    }
    toHexString() {
        return this._hex;
    }
    toJSON(key) {
        return { type: "BigNumber", hex: this.toHexString() };
    }
    static from(value) {
        if (value instanceof BigNumber) {
            return value;
        }
        if (typeof (value) === "string") {
            if (value.match(/^-?0x[0-9a-f]+$/i)) {
                return new BigNumber(_constructorGuard, toHex(value));
            }
            if (value.match(/^-?[0-9]+$/)) {
                return new BigNumber(_constructorGuard, toHex(new BN(value)));
            }
            return logger.throwArgumentError("invalid BigNumber string", "value", value);
        }
        if (typeof (value) === "number") {
            if (value % 1) {
                throwFault("underflow", "BigNumber.from", value);
            }
            if (value >= MAX_SAFE || value <= -MAX_SAFE) {
                throwFault("overflow", "BigNumber.from", value);
            }
            return BigNumber.from(String(value));
        }
        const anyValue = value;
        if (typeof (anyValue) === "bigint") {
            return BigNumber.from(anyValue.toString());
        }
        if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.isBytes)(anyValue)) {
            return BigNumber.from((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.hexlify)(anyValue));
        }
        if (anyValue) {
            // Hexable interface (takes priority)
            if (anyValue.toHexString) {
                const hex = anyValue.toHexString();
                if (typeof (hex) === "string") {
                    return BigNumber.from(hex);
                }
            }
            else {
                // For now, handle legacy JSON-ified values (goes away in v6)
                let hex = anyValue._hex;
                // New-form JSON
                if (hex == null && anyValue.type === "BigNumber") {
                    hex = anyValue.hex;
                }
                if (typeof (hex) === "string") {
                    if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.isHexString)(hex) || (hex[0] === "-" && (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.isHexString)(hex.substring(1)))) {
                        return BigNumber.from(hex);
                    }
                }
            }
        }
        return logger.throwArgumentError("invalid BigNumber value", "value", value);
    }
    static isBigNumber(value) {
        return !!(value && value._isBigNumber);
    }
}
// Normalize the hex string
function toHex(value) {
    // For BN, call on the hex string
    if (typeof (value) !== "string") {
        return toHex(value.toString(16));
    }
    // If negative, prepend the negative sign to the normalized positive value
    if (value[0] === "-") {
        // Strip off the negative sign
        value = value.substring(1);
        // Cannot have multiple negative signs (e.g. "--0x04")
        if (value[0] === "-") {
            logger.throwArgumentError("invalid hex", "value", value);
        }
        // Call toHex on the positive component
        value = toHex(value);
        // Do not allow "-0x00"
        if (value === "0x00") {
            return value;
        }
        // Negate the value
        return "-" + value;
    }
    // Add a "0x" prefix if missing
    if (value.substring(0, 2) !== "0x") {
        value = "0x" + value;
    }
    // Normalize zero
    if (value === "0x") {
        return "0x00";
    }
    // Make the string even length
    if (value.length % 2) {
        value = "0x0" + value.substring(2);
    }
    // Trim to smallest even-length string
    while (value.length > 4 && value.substring(0, 4) === "0x00") {
        value = "0x" + value.substring(4);
    }
    return value;
}
function toBigNumber(value) {
    return BigNumber.from(toHex(value));
}
function toBN(value) {
    const hex = BigNumber.from(value).toHexString();
    if (hex[0] === "-") {
        return (new BN("-" + hex.substring(3), 16));
    }
    return new BN(hex.substring(2), 16);
}
function throwFault(fault, operation, value) {
    const params = { fault: fault, operation: operation };
    if (value != null) {
        params.value = value;
    }
    return logger.throwError(fault, _ethersproject_logger__WEBPACK_IMPORTED_MODULE_1__.Logger.errors.NUMERIC_FAULT, params);
}
// value should have no prefix
function _base36To16(value) {
    return (new BN(value, 36)).toString(16);
}
// value should have no prefix
function _base16To36(value) {
    return (new BN(value, 16)).toString(36);
}
//# sourceMappingURL=bignumber.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/bignumber/lib.esm/fixednumber.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@ethersproject/bignumber/lib.esm/fixednumber.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FixedFormat": () => (/* binding */ FixedFormat),
/* harmony export */   "FixedNumber": () => (/* binding */ FixedNumber),
/* harmony export */   "formatFixed": () => (/* binding */ formatFixed),
/* harmony export */   "parseFixed": () => (/* binding */ parseFixed)
/* harmony export */ });
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/bignumber/lib.esm/_version.js");
/* harmony import */ var _bignumber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./bignumber */ "./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js");




const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);

const _constructorGuard = {};
const Zero = _bignumber__WEBPACK_IMPORTED_MODULE_2__.BigNumber.from(0);
const NegativeOne = _bignumber__WEBPACK_IMPORTED_MODULE_2__.BigNumber.from(-1);
function throwFault(message, fault, operation, value) {
    const params = { fault: fault, operation: operation };
    if (value !== undefined) {
        params.value = value;
    }
    return logger.throwError(message, _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.NUMERIC_FAULT, params);
}
// Constant to pull zeros from for multipliers
let zeros = "0";
while (zeros.length < 256) {
    zeros += zeros;
}
// Returns a string "1" followed by decimal "0"s
function getMultiplier(decimals) {
    if (typeof (decimals) !== "number") {
        try {
            decimals = _bignumber__WEBPACK_IMPORTED_MODULE_2__.BigNumber.from(decimals).toNumber();
        }
        catch (e) { }
    }
    if (typeof (decimals) === "number" && decimals >= 0 && decimals <= 256 && !(decimals % 1)) {
        return ("1" + zeros.substring(0, decimals));
    }
    return logger.throwArgumentError("invalid decimal size", "decimals", decimals);
}
function formatFixed(value, decimals) {
    if (decimals == null) {
        decimals = 0;
    }
    const multiplier = getMultiplier(decimals);
    // Make sure wei is a big number (convert as necessary)
    value = _bignumber__WEBPACK_IMPORTED_MODULE_2__.BigNumber.from(value);
    const negative = value.lt(Zero);
    if (negative) {
        value = value.mul(NegativeOne);
    }
    let fraction = value.mod(multiplier).toString();
    while (fraction.length < multiplier.length - 1) {
        fraction = "0" + fraction;
    }
    // Strip training 0
    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];
    const whole = value.div(multiplier).toString();
    if (multiplier.length === 1) {
        value = whole;
    }
    else {
        value = whole + "." + fraction;
    }
    if (negative) {
        value = "-" + value;
    }
    return value;
}
function parseFixed(value, decimals) {
    if (decimals == null) {
        decimals = 0;
    }
    const multiplier = getMultiplier(decimals);
    if (typeof (value) !== "string" || !value.match(/^-?[0-9.]+$/)) {
        logger.throwArgumentError("invalid decimal value", "value", value);
    }
    // Is it negative?
    const negative = (value.substring(0, 1) === "-");
    if (negative) {
        value = value.substring(1);
    }
    if (value === ".") {
        logger.throwArgumentError("missing value", "value", value);
    }
    // Split it into a whole and fractional part
    const comps = value.split(".");
    if (comps.length > 2) {
        logger.throwArgumentError("too many decimal points", "value", value);
    }
    let whole = comps[0], fraction = comps[1];
    if (!whole) {
        whole = "0";
    }
    if (!fraction) {
        fraction = "0";
    }
    // Trim trailing zeros
    while (fraction[fraction.length - 1] === "0") {
        fraction = fraction.substring(0, fraction.length - 1);
    }
    // Check the fraction doesn't exceed our decimals size
    if (fraction.length > multiplier.length - 1) {
        throwFault("fractional component exceeds decimals", "underflow", "parseFixed");
    }
    // If decimals is 0, we have an empty string for fraction
    if (fraction === "") {
        fraction = "0";
    }
    // Fully pad the string with zeros to get to wei
    while (fraction.length < multiplier.length - 1) {
        fraction += "0";
    }
    const wholeValue = _bignumber__WEBPACK_IMPORTED_MODULE_2__.BigNumber.from(whole);
    const fractionValue = _bignumber__WEBPACK_IMPORTED_MODULE_2__.BigNumber.from(fraction);
    let wei = (wholeValue.mul(multiplier)).add(fractionValue);
    if (negative) {
        wei = wei.mul(NegativeOne);
    }
    return wei;
}
class FixedFormat {
    constructor(constructorGuard, signed, width, decimals) {
        if (constructorGuard !== _constructorGuard) {
            logger.throwError("cannot use FixedFormat constructor; use FixedFormat.from", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "new FixedFormat"
            });
        }
        this.signed = signed;
        this.width = width;
        this.decimals = decimals;
        this.name = (signed ? "" : "u") + "fixed" + String(width) + "x" + String(decimals);
        this._multiplier = getMultiplier(decimals);
        Object.freeze(this);
    }
    static from(value) {
        if (value instanceof FixedFormat) {
            return value;
        }
        if (typeof (value) === "number") {
            value = `fixed128x${value}`;
        }
        let signed = true;
        let width = 128;
        let decimals = 18;
        if (typeof (value) === "string") {
            if (value === "fixed") {
                // defaults...
            }
            else if (value === "ufixed") {
                signed = false;
            }
            else {
                const match = value.match(/^(u?)fixed([0-9]+)x([0-9]+)$/);
                if (!match) {
                    logger.throwArgumentError("invalid fixed format", "format", value);
                }
                signed = (match[1] !== "u");
                width = parseInt(match[2]);
                decimals = parseInt(match[3]);
            }
        }
        else if (value) {
            const check = (key, type, defaultValue) => {
                if (value[key] == null) {
                    return defaultValue;
                }
                if (typeof (value[key]) !== type) {
                    logger.throwArgumentError("invalid fixed format (" + key + " not " + type + ")", "format." + key, value[key]);
                }
                return value[key];
            };
            signed = check("signed", "boolean", signed);
            width = check("width", "number", width);
            decimals = check("decimals", "number", decimals);
        }
        if (width % 8) {
            logger.throwArgumentError("invalid fixed format width (not byte aligned)", "format.width", width);
        }
        if (decimals > 80) {
            logger.throwArgumentError("invalid fixed format (decimals too large)", "format.decimals", decimals);
        }
        return new FixedFormat(_constructorGuard, signed, width, decimals);
    }
}
class FixedNumber {
    constructor(constructorGuard, hex, value, format) {
        if (constructorGuard !== _constructorGuard) {
            logger.throwError("cannot use FixedNumber constructor; use FixedNumber.from", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "new FixedFormat"
            });
        }
        this.format = format;
        this._hex = hex;
        this._value = value;
        this._isFixedNumber = true;
        Object.freeze(this);
    }
    _checkFormat(other) {
        if (this.format.name !== other.format.name) {
            logger.throwArgumentError("incompatible format; use fixedNumber.toFormat", "other", other);
        }
    }
    addUnsafe(other) {
        this._checkFormat(other);
        const a = parseFixed(this._value, this.format.decimals);
        const b = parseFixed(other._value, other.format.decimals);
        return FixedNumber.fromValue(a.add(b), this.format.decimals, this.format);
    }
    subUnsafe(other) {
        this._checkFormat(other);
        const a = parseFixed(this._value, this.format.decimals);
        const b = parseFixed(other._value, other.format.decimals);
        return FixedNumber.fromValue(a.sub(b), this.format.decimals, this.format);
    }
    mulUnsafe(other) {
        this._checkFormat(other);
        const a = parseFixed(this._value, this.format.decimals);
        const b = parseFixed(other._value, other.format.decimals);
        return FixedNumber.fromValue(a.mul(b).div(this.format._multiplier), this.format.decimals, this.format);
    }
    divUnsafe(other) {
        this._checkFormat(other);
        const a = parseFixed(this._value, this.format.decimals);
        const b = parseFixed(other._value, other.format.decimals);
        return FixedNumber.fromValue(a.mul(this.format._multiplier).div(b), this.format.decimals, this.format);
    }
    floor() {
        const comps = this.toString().split(".");
        if (comps.length === 1) {
            comps.push("0");
        }
        let result = FixedNumber.from(comps[0], this.format);
        const hasFraction = !comps[1].match(/^(0*)$/);
        if (this.isNegative() && hasFraction) {
            result = result.subUnsafe(ONE.toFormat(result.format));
        }
        return result;
    }
    ceiling() {
        const comps = this.toString().split(".");
        if (comps.length === 1) {
            comps.push("0");
        }
        let result = FixedNumber.from(comps[0], this.format);
        const hasFraction = !comps[1].match(/^(0*)$/);
        if (!this.isNegative() && hasFraction) {
            result = result.addUnsafe(ONE.toFormat(result.format));
        }
        return result;
    }
    // @TODO: Support other rounding algorithms
    round(decimals) {
        if (decimals == null) {
            decimals = 0;
        }
        // If we are already in range, we're done
        const comps = this.toString().split(".");
        if (comps.length === 1) {
            comps.push("0");
        }
        if (decimals < 0 || decimals > 80 || (decimals % 1)) {
            logger.throwArgumentError("invalid decimal count", "decimals", decimals);
        }
        if (comps[1].length <= decimals) {
            return this;
        }
        const factor = FixedNumber.from("1" + zeros.substring(0, decimals), this.format);
        const bump = BUMP.toFormat(this.format);
        return this.mulUnsafe(factor).addUnsafe(bump).floor().divUnsafe(factor);
    }
    isZero() {
        return (this._value === "0.0" || this._value === "0");
    }
    isNegative() {
        return (this._value[0] === "-");
    }
    toString() { return this._value; }
    toHexString(width) {
        if (width == null) {
            return this._hex;
        }
        if (width % 8) {
            logger.throwArgumentError("invalid byte width", "width", width);
        }
        const hex = _bignumber__WEBPACK_IMPORTED_MODULE_2__.BigNumber.from(this._hex).fromTwos(this.format.width).toTwos(width).toHexString();
        return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.hexZeroPad)(hex, width / 8);
    }
    toUnsafeFloat() { return parseFloat(this.toString()); }
    toFormat(format) {
        return FixedNumber.fromString(this._value, format);
    }
    static fromValue(value, decimals, format) {
        // If decimals looks more like a format, and there is no format, shift the parameters
        if (format == null && decimals != null && !(0,_bignumber__WEBPACK_IMPORTED_MODULE_2__.isBigNumberish)(decimals)) {
            format = decimals;
            decimals = null;
        }
        if (decimals == null) {
            decimals = 0;
        }
        if (format == null) {
            format = "fixed";
        }
        return FixedNumber.fromString(formatFixed(value, decimals), FixedFormat.from(format));
    }
    static fromString(value, format) {
        if (format == null) {
            format = "fixed";
        }
        const fixedFormat = FixedFormat.from(format);
        const numeric = parseFixed(value, fixedFormat.decimals);
        if (!fixedFormat.signed && numeric.lt(Zero)) {
            throwFault("unsigned value cannot be negative", "overflow", "value", value);
        }
        let hex = null;
        if (fixedFormat.signed) {
            hex = numeric.toTwos(fixedFormat.width).toHexString();
        }
        else {
            hex = numeric.toHexString();
            hex = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.hexZeroPad)(hex, fixedFormat.width / 8);
        }
        const decimal = formatFixed(numeric, fixedFormat.decimals);
        return new FixedNumber(_constructorGuard, hex, decimal, fixedFormat);
    }
    static fromBytes(value, format) {
        if (format == null) {
            format = "fixed";
        }
        const fixedFormat = FixedFormat.from(format);
        if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.arrayify)(value).length > fixedFormat.width / 8) {
            throw new Error("overflow");
        }
        let numeric = _bignumber__WEBPACK_IMPORTED_MODULE_2__.BigNumber.from(value);
        if (fixedFormat.signed) {
            numeric = numeric.fromTwos(fixedFormat.width);
        }
        const hex = numeric.toTwos((fixedFormat.signed ? 0 : 1) + fixedFormat.width).toHexString();
        const decimal = formatFixed(numeric, fixedFormat.decimals);
        return new FixedNumber(_constructorGuard, hex, decimal, fixedFormat);
    }
    static from(value, format) {
        if (typeof (value) === "string") {
            return FixedNumber.fromString(value, format);
        }
        if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__.isBytes)(value)) {
            return FixedNumber.fromBytes(value, format);
        }
        try {
            return FixedNumber.fromValue(value, 0, format);
        }
        catch (error) {
            // Allow NUMERIC_FAULT to bubble up
            if (error.code !== _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.INVALID_ARGUMENT) {
                throw error;
            }
        }
        return logger.throwArgumentError("invalid FixedNumber value", "value", value);
    }
    static isFixedNumber(value) {
        return !!(value && value._isFixedNumber);
    }
}
const ONE = FixedNumber.from(1);
const BUMP = FixedNumber.from("0.5");
//# sourceMappingURL=fixednumber.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/bytes/lib.esm/_version.js":
/*!***************************************************************!*\
  !*** ./node_modules/@ethersproject/bytes/lib.esm/_version.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "bytes/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/bytes/lib.esm/index.js":
/*!************************************************************!*\
  !*** ./node_modules/@ethersproject/bytes/lib.esm/index.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "arrayify": () => (/* binding */ arrayify),
/* harmony export */   "concat": () => (/* binding */ concat),
/* harmony export */   "hexConcat": () => (/* binding */ hexConcat),
/* harmony export */   "hexDataLength": () => (/* binding */ hexDataLength),
/* harmony export */   "hexDataSlice": () => (/* binding */ hexDataSlice),
/* harmony export */   "hexStripZeros": () => (/* binding */ hexStripZeros),
/* harmony export */   "hexValue": () => (/* binding */ hexValue),
/* harmony export */   "hexZeroPad": () => (/* binding */ hexZeroPad),
/* harmony export */   "hexlify": () => (/* binding */ hexlify),
/* harmony export */   "isBytes": () => (/* binding */ isBytes),
/* harmony export */   "isBytesLike": () => (/* binding */ isBytesLike),
/* harmony export */   "isHexString": () => (/* binding */ isHexString),
/* harmony export */   "joinSignature": () => (/* binding */ joinSignature),
/* harmony export */   "splitSignature": () => (/* binding */ splitSignature),
/* harmony export */   "stripZeros": () => (/* binding */ stripZeros),
/* harmony export */   "zeroPad": () => (/* binding */ zeroPad)
/* harmony export */ });
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/bytes/lib.esm/_version.js");



const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
///////////////////////////////
function isHexable(value) {
    return !!(value.toHexString);
}
function addSlice(array) {
    if (array.slice) {
        return array;
    }
    array.slice = function () {
        const args = Array.prototype.slice.call(arguments);
        return addSlice(new Uint8Array(Array.prototype.slice.apply(array, args)));
    };
    return array;
}
function isBytesLike(value) {
    return ((isHexString(value) && !(value.length % 2)) || isBytes(value));
}
function isInteger(value) {
    return (typeof (value) === "number" && value == value && (value % 1) === 0);
}
function isBytes(value) {
    if (value == null) {
        return false;
    }
    if (value.constructor === Uint8Array) {
        return true;
    }
    if (typeof (value) === "string") {
        return false;
    }
    if (!isInteger(value.length) || value.length < 0) {
        return false;
    }
    for (let i = 0; i < value.length; i++) {
        const v = value[i];
        if (!isInteger(v) || v < 0 || v >= 256) {
            return false;
        }
    }
    return true;
}
function arrayify(value, options) {
    if (!options) {
        options = {};
    }
    if (typeof (value) === "number") {
        logger.checkSafeUint53(value, "invalid arrayify value");
        const result = [];
        while (value) {
            result.unshift(value & 0xff);
            value = parseInt(String(value / 256));
        }
        if (result.length === 0) {
            result.push(0);
        }
        return addSlice(new Uint8Array(result));
    }
    if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
        value = "0x" + value;
    }
    if (isHexable(value)) {
        value = value.toHexString();
    }
    if (isHexString(value)) {
        let hex = value.substring(2);
        if (hex.length % 2) {
            if (options.hexPad === "left") {
                hex = "0" + hex;
            }
            else if (options.hexPad === "right") {
                hex += "0";
            }
            else {
                logger.throwArgumentError("hex data is odd-length", "value", value);
            }
        }
        const result = [];
        for (let i = 0; i < hex.length; i += 2) {
            result.push(parseInt(hex.substring(i, i + 2), 16));
        }
        return addSlice(new Uint8Array(result));
    }
    if (isBytes(value)) {
        return addSlice(new Uint8Array(value));
    }
    return logger.throwArgumentError("invalid arrayify value", "value", value);
}
function concat(items) {
    const objects = items.map(item => arrayify(item));
    const length = objects.reduce((accum, item) => (accum + item.length), 0);
    const result = new Uint8Array(length);
    objects.reduce((offset, object) => {
        result.set(object, offset);
        return offset + object.length;
    }, 0);
    return addSlice(result);
}
function stripZeros(value) {
    let result = arrayify(value);
    if (result.length === 0) {
        return result;
    }
    // Find the first non-zero entry
    let start = 0;
    while (start < result.length && result[start] === 0) {
        start++;
    }
    // If we started with zeros, strip them
    if (start) {
        result = result.slice(start);
    }
    return result;
}
function zeroPad(value, length) {
    value = arrayify(value);
    if (value.length > length) {
        logger.throwArgumentError("value out of range", "value", arguments[0]);
    }
    const result = new Uint8Array(length);
    result.set(value, length - value.length);
    return addSlice(result);
}
function isHexString(value, length) {
    if (typeof (value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
        return false;
    }
    if (length && value.length !== 2 + 2 * length) {
        return false;
    }
    return true;
}
const HexCharacters = "0123456789abcdef";
function hexlify(value, options) {
    if (!options) {
        options = {};
    }
    if (typeof (value) === "number") {
        logger.checkSafeUint53(value, "invalid hexlify value");
        let hex = "";
        while (value) {
            hex = HexCharacters[value & 0xf] + hex;
            value = Math.floor(value / 16);
        }
        if (hex.length) {
            if (hex.length % 2) {
                hex = "0" + hex;
            }
            return "0x" + hex;
        }
        return "0x00";
    }
    if (typeof (value) === "bigint") {
        value = value.toString(16);
        if (value.length % 2) {
            return ("0x0" + value);
        }
        return "0x" + value;
    }
    if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
        value = "0x" + value;
    }
    if (isHexable(value)) {
        return value.toHexString();
    }
    if (isHexString(value)) {
        if (value.length % 2) {
            if (options.hexPad === "left") {
                value = "0x0" + value.substring(2);
            }
            else if (options.hexPad === "right") {
                value += "0";
            }
            else {
                logger.throwArgumentError("hex data is odd-length", "value", value);
            }
        }
        return value.toLowerCase();
    }
    if (isBytes(value)) {
        let result = "0x";
        for (let i = 0; i < value.length; i++) {
            let v = value[i];
            result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
        }
        return result;
    }
    return logger.throwArgumentError("invalid hexlify value", "value", value);
}
/*
function unoddify(value: BytesLike | Hexable | number): BytesLike | Hexable | number {
    if (typeof(value) === "string" && value.length % 2 && value.substring(0, 2) === "0x") {
        return "0x0" + value.substring(2);
    }
    return value;
}
*/
function hexDataLength(data) {
    if (typeof (data) !== "string") {
        data = hexlify(data);
    }
    else if (!isHexString(data) || (data.length % 2)) {
        return null;
    }
    return (data.length - 2) / 2;
}
function hexDataSlice(data, offset, endOffset) {
    if (typeof (data) !== "string") {
        data = hexlify(data);
    }
    else if (!isHexString(data) || (data.length % 2)) {
        logger.throwArgumentError("invalid hexData", "value", data);
    }
    offset = 2 + 2 * offset;
    if (endOffset != null) {
        return "0x" + data.substring(offset, 2 + 2 * endOffset);
    }
    return "0x" + data.substring(offset);
}
function hexConcat(items) {
    let result = "0x";
    items.forEach((item) => {
        result += hexlify(item).substring(2);
    });
    return result;
}
function hexValue(value) {
    const trimmed = hexStripZeros(hexlify(value, { hexPad: "left" }));
    if (trimmed === "0x") {
        return "0x0";
    }
    return trimmed;
}
function hexStripZeros(value) {
    if (typeof (value) !== "string") {
        value = hexlify(value);
    }
    if (!isHexString(value)) {
        logger.throwArgumentError("invalid hex string", "value", value);
    }
    value = value.substring(2);
    let offset = 0;
    while (offset < value.length && value[offset] === "0") {
        offset++;
    }
    return "0x" + value.substring(offset);
}
function hexZeroPad(value, length) {
    if (typeof (value) !== "string") {
        value = hexlify(value);
    }
    else if (!isHexString(value)) {
        logger.throwArgumentError("invalid hex string", "value", value);
    }
    if (value.length > 2 * length + 2) {
        logger.throwArgumentError("value out of range", "value", arguments[1]);
    }
    while (value.length < 2 * length + 2) {
        value = "0x0" + value.substring(2);
    }
    return value;
}
function splitSignature(signature) {
    const result = {
        r: "0x",
        s: "0x",
        _vs: "0x",
        recoveryParam: 0,
        v: 0,
        yParityAndS: "0x",
        compact: "0x"
    };
    if (isBytesLike(signature)) {
        let bytes = arrayify(signature);
        // Get the r, s and v
        if (bytes.length === 64) {
            // EIP-2098; pull the v from the top bit of s and clear it
            result.v = 27 + (bytes[32] >> 7);
            bytes[32] &= 0x7f;
            result.r = hexlify(bytes.slice(0, 32));
            result.s = hexlify(bytes.slice(32, 64));
        }
        else if (bytes.length === 65) {
            result.r = hexlify(bytes.slice(0, 32));
            result.s = hexlify(bytes.slice(32, 64));
            result.v = bytes[64];
        }
        else {
            logger.throwArgumentError("invalid signature string", "signature", signature);
        }
        // Allow a recid to be used as the v
        if (result.v < 27) {
            if (result.v === 0 || result.v === 1) {
                result.v += 27;
            }
            else {
                logger.throwArgumentError("signature invalid v byte", "signature", signature);
            }
        }
        // Compute recoveryParam from v
        result.recoveryParam = 1 - (result.v % 2);
        // Compute _vs from recoveryParam and s
        if (result.recoveryParam) {
            bytes[32] |= 0x80;
        }
        result._vs = hexlify(bytes.slice(32, 64));
    }
    else {
        result.r = signature.r;
        result.s = signature.s;
        result.v = signature.v;
        result.recoveryParam = signature.recoveryParam;
        result._vs = signature._vs;
        // If the _vs is available, use it to populate missing s, v and recoveryParam
        // and verify non-missing s, v and recoveryParam
        if (result._vs != null) {
            const vs = zeroPad(arrayify(result._vs), 32);
            result._vs = hexlify(vs);
            // Set or check the recid
            const recoveryParam = ((vs[0] >= 128) ? 1 : 0);
            if (result.recoveryParam == null) {
                result.recoveryParam = recoveryParam;
            }
            else if (result.recoveryParam !== recoveryParam) {
                logger.throwArgumentError("signature recoveryParam mismatch _vs", "signature", signature);
            }
            // Set or check the s
            vs[0] &= 0x7f;
            const s = hexlify(vs);
            if (result.s == null) {
                result.s = s;
            }
            else if (result.s !== s) {
                logger.throwArgumentError("signature v mismatch _vs", "signature", signature);
            }
        }
        // Use recid and v to populate each other
        if (result.recoveryParam == null) {
            if (result.v == null) {
                logger.throwArgumentError("signature missing v and recoveryParam", "signature", signature);
            }
            else if (result.v === 0 || result.v === 1) {
                result.recoveryParam = result.v;
            }
            else {
                result.recoveryParam = 1 - (result.v % 2);
            }
        }
        else {
            if (result.v == null) {
                result.v = 27 + result.recoveryParam;
            }
            else {
                const recId = (result.v === 0 || result.v === 1) ? result.v : (1 - (result.v % 2));
                if (result.recoveryParam !== recId) {
                    logger.throwArgumentError("signature recoveryParam mismatch v", "signature", signature);
                }
            }
        }
        if (result.r == null || !isHexString(result.r)) {
            logger.throwArgumentError("signature missing or invalid r", "signature", signature);
        }
        else {
            result.r = hexZeroPad(result.r, 32);
        }
        if (result.s == null || !isHexString(result.s)) {
            logger.throwArgumentError("signature missing or invalid s", "signature", signature);
        }
        else {
            result.s = hexZeroPad(result.s, 32);
        }
        const vs = arrayify(result.s);
        if (vs[0] >= 128) {
            logger.throwArgumentError("signature s out of range", "signature", signature);
        }
        if (result.recoveryParam) {
            vs[0] |= 0x80;
        }
        const _vs = hexlify(vs);
        if (result._vs) {
            if (!isHexString(result._vs)) {
                logger.throwArgumentError("signature invalid _vs", "signature", signature);
            }
            result._vs = hexZeroPad(result._vs, 32);
        }
        // Set or check the _vs
        if (result._vs == null) {
            result._vs = _vs;
        }
        else if (result._vs !== _vs) {
            logger.throwArgumentError("signature _vs mismatch v and s", "signature", signature);
        }
    }
    result.yParityAndS = result._vs;
    result.compact = result.r + result.yParityAndS.substring(2);
    return result;
}
function joinSignature(signature) {
    signature = splitSignature(signature);
    return hexlify(concat([
        signature.r,
        signature.s,
        (signature.recoveryParam ? "0x1c" : "0x1b")
    ]));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/constants/lib.esm/bignumbers.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@ethersproject/constants/lib.esm/bignumbers.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MaxInt256": () => (/* binding */ MaxInt256),
/* harmony export */   "MaxUint256": () => (/* binding */ MaxUint256),
/* harmony export */   "MinInt256": () => (/* binding */ MinInt256),
/* harmony export */   "NegativeOne": () => (/* binding */ NegativeOne),
/* harmony export */   "One": () => (/* binding */ One),
/* harmony export */   "Two": () => (/* binding */ Two),
/* harmony export */   "WeiPerEther": () => (/* binding */ WeiPerEther),
/* harmony export */   "Zero": () => (/* binding */ Zero)
/* harmony export */ });
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/bignumber */ "./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js");

const NegativeOne = ( /*#__PURE__*/_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from(-1));
const Zero = ( /*#__PURE__*/_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from(0));
const One = ( /*#__PURE__*/_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from(1));
const Two = ( /*#__PURE__*/_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from(2));
const WeiPerEther = ( /*#__PURE__*/_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from("1000000000000000000"));
const MaxUint256 = ( /*#__PURE__*/_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));
const MinInt256 = ( /*#__PURE__*/_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from("-0x8000000000000000000000000000000000000000000000000000000000000000"));
const MaxInt256 = ( /*#__PURE__*/_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__.BigNumber.from("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));

//# sourceMappingURL=bignumbers.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/contracts/lib.esm/_version.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@ethersproject/contracts/lib.esm/_version.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "contracts/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/contracts/lib.esm/index.js":
/*!****************************************************************!*\
  !*** ./node_modules/@ethersproject/contracts/lib.esm/index.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BaseContract": () => (/* binding */ BaseContract),
/* harmony export */   "Contract": () => (/* binding */ Contract),
/* harmony export */   "ContractFactory": () => (/* binding */ ContractFactory)
/* harmony export */ });
/* harmony import */ var _ethersproject_abi__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @ethersproject/abi */ "./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js");
/* harmony import */ var _ethersproject_abi__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @ethersproject/abi */ "./node_modules/@ethersproject/abi/lib.esm/interface.js");
/* harmony import */ var _ethersproject_abstract_provider__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @ethersproject/abstract-provider */ "./node_modules/@ethersproject/abstract-provider/lib.esm/index.js");
/* harmony import */ var _ethersproject_abstract_signer__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @ethersproject/abstract-signer */ "./node_modules/@ethersproject/abstract-signer/lib.esm/index.js");
/* harmony import */ var _ethersproject_address__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/address */ "./node_modules/@ethersproject/address/lib.esm/index.js");
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @ethersproject/bignumber */ "./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js");
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @ethersproject/properties */ "./node_modules/@ethersproject/properties/lib.esm/index.js");
/* harmony import */ var _ethersproject_transactions__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @ethersproject/transactions */ "./node_modules/@ethersproject/transactions/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/contracts/lib.esm/_version.js");

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};










const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
;
;
///////////////////////////////
const allowedTransactionKeys = {
    chainId: true, data: true, from: true, gasLimit: true, gasPrice: true, nonce: true, to: true, value: true,
    type: true, accessList: true,
    maxFeePerGas: true, maxPriorityFeePerGas: true,
    customData: true,
    ccipReadEnabled: true
};
function resolveName(resolver, nameOrPromise) {
    return __awaiter(this, void 0, void 0, function* () {
        const name = yield nameOrPromise;
        if (typeof (name) !== "string") {
            logger.throwArgumentError("invalid address or ENS name", "name", name);
        }
        // If it is already an address, just use it (after adding checksum)
        try {
            return (0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_2__.getAddress)(name);
        }
        catch (error) { }
        if (!resolver) {
            logger.throwError("a provider or signer is needed to resolve ENS names", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "resolveName"
            });
        }
        const address = yield resolver.resolveName(name);
        if (address == null) {
            logger.throwArgumentError("resolver or addr is not configured for ENS name", "name", name);
        }
        return address;
    });
}
// Recursively replaces ENS names with promises to resolve the name and resolves all properties
function resolveAddresses(resolver, value, paramType) {
    return __awaiter(this, void 0, void 0, function* () {
        if (Array.isArray(paramType)) {
            return yield Promise.all(paramType.map((paramType, index) => {
                return resolveAddresses(resolver, ((Array.isArray(value)) ? value[index] : value[paramType.name]), paramType);
            }));
        }
        if (paramType.type === "address") {
            return yield resolveName(resolver, value);
        }
        if (paramType.type === "tuple") {
            return yield resolveAddresses(resolver, value, paramType.components);
        }
        if (paramType.baseType === "array") {
            if (!Array.isArray(value)) {
                return Promise.reject(logger.makeError("invalid value for array", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.INVALID_ARGUMENT, {
                    argument: "value",
                    value
                }));
            }
            return yield Promise.all(value.map((v) => resolveAddresses(resolver, v, paramType.arrayChildren)));
        }
        return value;
    });
}
function populateTransaction(contract, fragment, args) {
    return __awaiter(this, void 0, void 0, function* () {
        // If an extra argument is given, it is overrides
        let overrides = {};
        if (args.length === fragment.inputs.length + 1 && typeof (args[args.length - 1]) === "object") {
            overrides = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.shallowCopy)(args.pop());
        }
        // Make sure the parameter count matches
        logger.checkArgumentCount(args.length, fragment.inputs.length, "passed to contract");
        // Populate "from" override (allow promises)
        if (contract.signer) {
            if (overrides.from) {
                // Contracts with a Signer are from the Signer's frame-of-reference;
                // but we allow overriding "from" if it matches the signer
                overrides.from = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.resolveProperties)({
                    override: resolveName(contract.signer, overrides.from),
                    signer: contract.signer.getAddress()
                }).then((check) => __awaiter(this, void 0, void 0, function* () {
                    if ((0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_2__.getAddress)(check.signer) !== check.override) {
                        logger.throwError("Contract with a Signer cannot override from", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                            operation: "overrides.from"
                        });
                    }
                    return check.override;
                }));
            }
            else {
                overrides.from = contract.signer.getAddress();
            }
        }
        else if (overrides.from) {
            overrides.from = resolveName(contract.provider, overrides.from);
            //} else {
            // Contracts without a signer can override "from", and if
            // unspecified the zero address is used
            //overrides.from = AddressZero;
        }
        // Wait for all dependencies to be resolved (prefer the signer over the provider)
        const resolved = yield (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.resolveProperties)({
            args: resolveAddresses(contract.signer || contract.provider, args, fragment.inputs),
            address: contract.resolvedAddress,
            overrides: ((0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.resolveProperties)(overrides) || {})
        });
        // The ABI coded transaction
        const data = contract.interface.encodeFunctionData(fragment, resolved.args);
        const tx = {
            data: data,
            to: resolved.address
        };
        // Resolved Overrides
        const ro = resolved.overrides;
        // Populate simple overrides
        if (ro.nonce != null) {
            tx.nonce = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(ro.nonce).toNumber();
        }
        if (ro.gasLimit != null) {
            tx.gasLimit = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(ro.gasLimit);
        }
        if (ro.gasPrice != null) {
            tx.gasPrice = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(ro.gasPrice);
        }
        if (ro.maxFeePerGas != null) {
            tx.maxFeePerGas = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(ro.maxFeePerGas);
        }
        if (ro.maxPriorityFeePerGas != null) {
            tx.maxPriorityFeePerGas = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(ro.maxPriorityFeePerGas);
        }
        if (ro.from != null) {
            tx.from = ro.from;
        }
        if (ro.type != null) {
            tx.type = ro.type;
        }
        if (ro.accessList != null) {
            tx.accessList = (0,_ethersproject_transactions__WEBPACK_IMPORTED_MODULE_5__.accessListify)(ro.accessList);
        }
        // If there was no "gasLimit" override, but the ABI specifies a default, use it
        if (tx.gasLimit == null && fragment.gas != null) {
            // Compute the intrinsic gas cost for this transaction
            // @TODO: This is based on the yellow paper as of Petersburg; this is something
            // we may wish to parameterize in v6 as part of the Network object. Since this
            // is always a non-nil to address, we can ignore G_create, but may wish to add
            // similar logic to the ContractFactory.
            let intrinsic = 21000;
            const bytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.arrayify)(data);
            for (let i = 0; i < bytes.length; i++) {
                intrinsic += 4;
                if (bytes[i]) {
                    intrinsic += 64;
                }
            }
            tx.gasLimit = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(fragment.gas).add(intrinsic);
        }
        // Populate "value" override
        if (ro.value) {
            const roValue = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(ro.value);
            if (!roValue.isZero() && !fragment.payable) {
                logger.throwError("non-payable method cannot override value", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "overrides.value",
                    value: overrides.value
                });
            }
            tx.value = roValue;
        }
        if (ro.customData) {
            tx.customData = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.shallowCopy)(ro.customData);
        }
        if (ro.ccipReadEnabled) {
            tx.ccipReadEnabled = !!ro.ccipReadEnabled;
        }
        // Remove the overrides
        delete overrides.nonce;
        delete overrides.gasLimit;
        delete overrides.gasPrice;
        delete overrides.from;
        delete overrides.value;
        delete overrides.type;
        delete overrides.accessList;
        delete overrides.maxFeePerGas;
        delete overrides.maxPriorityFeePerGas;
        delete overrides.customData;
        delete overrides.ccipReadEnabled;
        // Make sure there are no stray overrides, which may indicate a
        // typo or using an unsupported key.
        const leftovers = Object.keys(overrides).filter((key) => (overrides[key] != null));
        if (leftovers.length) {
            logger.throwError(`cannot override ${leftovers.map((l) => JSON.stringify(l)).join(",")}`, _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "overrides",
                overrides: leftovers
            });
        }
        return tx;
    });
}
function buildPopulate(contract, fragment) {
    return function (...args) {
        return populateTransaction(contract, fragment, args);
    };
}
function buildEstimate(contract, fragment) {
    const signerOrProvider = (contract.signer || contract.provider);
    return function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!signerOrProvider) {
                logger.throwError("estimate require a provider or signer", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "estimateGas"
                });
            }
            const tx = yield populateTransaction(contract, fragment, args);
            return yield signerOrProvider.estimateGas(tx);
        });
    };
}
function addContractWait(contract, tx) {
    const wait = tx.wait.bind(tx);
    tx.wait = (confirmations) => {
        return wait(confirmations).then((receipt) => {
            receipt.events = receipt.logs.map((log) => {
                let event = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.deepCopy)(log);
                let parsed = null;
                try {
                    parsed = contract.interface.parseLog(log);
                }
                catch (e) { }
                // Successfully parsed the event log; include it
                if (parsed) {
                    event.args = parsed.args;
                    event.decode = (data, topics) => {
                        return contract.interface.decodeEventLog(parsed.eventFragment, data, topics);
                    };
                    event.event = parsed.name;
                    event.eventSignature = parsed.signature;
                }
                // Useful operations
                event.removeListener = () => { return contract.provider; };
                event.getBlock = () => {
                    return contract.provider.getBlock(receipt.blockHash);
                };
                event.getTransaction = () => {
                    return contract.provider.getTransaction(receipt.transactionHash);
                };
                event.getTransactionReceipt = () => {
                    return Promise.resolve(receipt);
                };
                return event;
            });
            return receipt;
        });
    };
}
function buildCall(contract, fragment, collapseSimple) {
    const signerOrProvider = (contract.signer || contract.provider);
    return function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            // Extract the "blockTag" override if present
            let blockTag = undefined;
            if (args.length === fragment.inputs.length + 1 && typeof (args[args.length - 1]) === "object") {
                const overrides = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.shallowCopy)(args.pop());
                if (overrides.blockTag != null) {
                    blockTag = yield overrides.blockTag;
                }
                delete overrides.blockTag;
                args.push(overrides);
            }
            // If the contract was just deployed, wait until it is mined
            if (contract.deployTransaction != null) {
                yield contract._deployed(blockTag);
            }
            // Call a node and get the result
            const tx = yield populateTransaction(contract, fragment, args);
            const result = yield signerOrProvider.call(tx, blockTag);
            try {
                let value = contract.interface.decodeFunctionResult(fragment, result);
                if (collapseSimple && fragment.outputs.length === 1) {
                    value = value[0];
                }
                return value;
            }
            catch (error) {
                if (error.code === _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.CALL_EXCEPTION) {
                    error.address = contract.address;
                    error.args = args;
                    error.transaction = tx;
                }
                throw error;
            }
        });
    };
}
function buildSend(contract, fragment) {
    return function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!contract.signer) {
                logger.throwError("sending a transaction requires a signer", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "sendTransaction"
                });
            }
            // If the contract was just deployed, wait until it is mined
            if (contract.deployTransaction != null) {
                yield contract._deployed();
            }
            const txRequest = yield populateTransaction(contract, fragment, args);
            const tx = yield contract.signer.sendTransaction(txRequest);
            // Tweak the tx.wait so the receipt has extra properties
            addContractWait(contract, tx);
            return tx;
        });
    };
}
function buildDefault(contract, fragment, collapseSimple) {
    if (fragment.constant) {
        return buildCall(contract, fragment, collapseSimple);
    }
    return buildSend(contract, fragment);
}
function getEventTag(filter) {
    if (filter.address && (filter.topics == null || filter.topics.length === 0)) {
        return "*";
    }
    return (filter.address || "*") + "@" + (filter.topics ? filter.topics.map((topic) => {
        if (Array.isArray(topic)) {
            return topic.join("|");
        }
        return topic;
    }).join(":") : "");
}
class RunningEvent {
    constructor(tag, filter) {
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "tag", tag);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "filter", filter);
        this._listeners = [];
    }
    addListener(listener, once) {
        this._listeners.push({ listener: listener, once: once });
    }
    removeListener(listener) {
        let done = false;
        this._listeners = this._listeners.filter((item) => {
            if (done || item.listener !== listener) {
                return true;
            }
            done = true;
            return false;
        });
    }
    removeAllListeners() {
        this._listeners = [];
    }
    listeners() {
        return this._listeners.map((i) => i.listener);
    }
    listenerCount() {
        return this._listeners.length;
    }
    run(args) {
        const listenerCount = this.listenerCount();
        this._listeners = this._listeners.filter((item) => {
            const argsCopy = args.slice();
            // Call the callback in the next event loop
            setTimeout(() => {
                item.listener.apply(this, argsCopy);
            }, 0);
            // Reschedule it if it not "once"
            return !(item.once);
        });
        return listenerCount;
    }
    prepareEvent(event) {
    }
    // Returns the array that will be applied to an emit
    getEmit(event) {
        return [event];
    }
}
class ErrorRunningEvent extends RunningEvent {
    constructor() {
        super("error", null);
    }
}
// @TODO Fragment should inherit Wildcard? and just override getEmit?
//       or have a common abstract super class, with enough constructor
//       options to configure both.
// A Fragment Event will populate all the properties that Wildcard
// will, and additionally dereference the arguments when emitting
class FragmentRunningEvent extends RunningEvent {
    constructor(address, contractInterface, fragment, topics) {
        const filter = {
            address: address
        };
        let topic = contractInterface.getEventTopic(fragment);
        if (topics) {
            if (topic !== topics[0]) {
                logger.throwArgumentError("topic mismatch", "topics", topics);
            }
            filter.topics = topics.slice();
        }
        else {
            filter.topics = [topic];
        }
        super(getEventTag(filter), filter);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "address", address);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "interface", contractInterface);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "fragment", fragment);
    }
    prepareEvent(event) {
        super.prepareEvent(event);
        event.event = this.fragment.name;
        event.eventSignature = this.fragment.format();
        event.decode = (data, topics) => {
            return this.interface.decodeEventLog(this.fragment, data, topics);
        };
        try {
            event.args = this.interface.decodeEventLog(this.fragment, event.data, event.topics);
        }
        catch (error) {
            event.args = null;
            event.decodeError = error;
        }
    }
    getEmit(event) {
        const errors = (0,_ethersproject_abi__WEBPACK_IMPORTED_MODULE_7__.checkResultErrors)(event.args);
        if (errors.length) {
            throw errors[0].error;
        }
        const args = (event.args || []).slice();
        args.push(event);
        return args;
    }
}
// A Wildcard Event will attempt to populate:
//  - event            The name of the event name
//  - eventSignature   The full signature of the event
//  - decode           A function to decode data and topics
//  - args             The decoded data and topics
class WildcardRunningEvent extends RunningEvent {
    constructor(address, contractInterface) {
        super("*", { address: address });
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "address", address);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "interface", contractInterface);
    }
    prepareEvent(event) {
        super.prepareEvent(event);
        try {
            const parsed = this.interface.parseLog(event);
            event.event = parsed.name;
            event.eventSignature = parsed.signature;
            event.decode = (data, topics) => {
                return this.interface.decodeEventLog(parsed.eventFragment, data, topics);
            };
            event.args = parsed.args;
        }
        catch (error) {
            // No matching event
        }
    }
}
class BaseContract {
    constructor(addressOrName, contractInterface, signerOrProvider) {
        // @TODO: Maybe still check the addressOrName looks like a valid address or name?
        //address = getAddress(address);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "interface", (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.getStatic)(new.target, "getInterface")(contractInterface));
        if (signerOrProvider == null) {
            (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "provider", null);
            (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "signer", null);
        }
        else if (_ethersproject_abstract_signer__WEBPACK_IMPORTED_MODULE_8__.Signer.isSigner(signerOrProvider)) {
            (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "provider", signerOrProvider.provider || null);
            (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "signer", signerOrProvider);
        }
        else if (_ethersproject_abstract_provider__WEBPACK_IMPORTED_MODULE_9__.Provider.isProvider(signerOrProvider)) {
            (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "provider", signerOrProvider);
            (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "signer", null);
        }
        else {
            logger.throwArgumentError("invalid signer or provider", "signerOrProvider", signerOrProvider);
        }
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "callStatic", {});
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "estimateGas", {});
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "functions", {});
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "populateTransaction", {});
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "filters", {});
        {
            const uniqueFilters = {};
            Object.keys(this.interface.events).forEach((eventSignature) => {
                const event = this.interface.events[eventSignature];
                (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this.filters, eventSignature, (...args) => {
                    return {
                        address: this.address,
                        topics: this.interface.encodeFilterTopics(event, args)
                    };
                });
                if (!uniqueFilters[event.name]) {
                    uniqueFilters[event.name] = [];
                }
                uniqueFilters[event.name].push(eventSignature);
            });
            Object.keys(uniqueFilters).forEach((name) => {
                const filters = uniqueFilters[name];
                if (filters.length === 1) {
                    (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this.filters, name, this.filters[filters[0]]);
                }
                else {
                    logger.warn(`Duplicate definition of ${name} (${filters.join(", ")})`);
                }
            });
        }
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "_runningEvents", {});
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "_wrappedEmits", {});
        if (addressOrName == null) {
            logger.throwArgumentError("invalid contract address or ENS name", "addressOrName", addressOrName);
        }
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "address", addressOrName);
        if (this.provider) {
            (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "resolvedAddress", resolveName(this.provider, addressOrName));
        }
        else {
            try {
                (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "resolvedAddress", Promise.resolve((0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_2__.getAddress)(addressOrName)));
            }
            catch (error) {
                // Without a provider, we cannot use ENS names
                logger.throwError("provider is required to use ENS name as contract address", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "new Contract"
                });
            }
        }
        // Swallow bad ENS names to prevent Unhandled Exceptions
        this.resolvedAddress.catch((e) => { });
        const uniqueNames = {};
        const uniqueSignatures = {};
        Object.keys(this.interface.functions).forEach((signature) => {
            const fragment = this.interface.functions[signature];
            // Check that the signature is unique; if not the ABI generation has
            // not been cleaned or may be incorrectly generated
            if (uniqueSignatures[signature]) {
                logger.warn(`Duplicate ABI entry for ${JSON.stringify(signature)}`);
                return;
            }
            uniqueSignatures[signature] = true;
            // Track unique names; we only expose bare named functions if they
            // are ambiguous
            {
                const name = fragment.name;
                if (!uniqueNames[`%${name}`]) {
                    uniqueNames[`%${name}`] = [];
                }
                uniqueNames[`%${name}`].push(signature);
            }
            if (this[signature] == null) {
                (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, signature, buildDefault(this, fragment, true));
            }
            // We do not collapse simple calls on this bucket, which allows
            // frameworks to safely use this without introspection as well as
            // allows decoding error recovery.
            if (this.functions[signature] == null) {
                (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this.functions, signature, buildDefault(this, fragment, false));
            }
            if (this.callStatic[signature] == null) {
                (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this.callStatic, signature, buildCall(this, fragment, true));
            }
            if (this.populateTransaction[signature] == null) {
                (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this.populateTransaction, signature, buildPopulate(this, fragment));
            }
            if (this.estimateGas[signature] == null) {
                (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this.estimateGas, signature, buildEstimate(this, fragment));
            }
        });
        Object.keys(uniqueNames).forEach((name) => {
            // Ambiguous names to not get attached as bare names
            const signatures = uniqueNames[name];
            if (signatures.length > 1) {
                return;
            }
            // Strip off the leading "%" used for prototype protection
            name = name.substring(1);
            const signature = signatures[0];
            // If overwriting a member property that is null, swallow the error
            try {
                if (this[name] == null) {
                    (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, name, this[signature]);
                }
            }
            catch (e) { }
            if (this.functions[name] == null) {
                (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this.functions, name, this.functions[signature]);
            }
            if (this.callStatic[name] == null) {
                (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this.callStatic, name, this.callStatic[signature]);
            }
            if (this.populateTransaction[name] == null) {
                (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this.populateTransaction, name, this.populateTransaction[signature]);
            }
            if (this.estimateGas[name] == null) {
                (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this.estimateGas, name, this.estimateGas[signature]);
            }
        });
    }
    static getContractAddress(transaction) {
        return (0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_2__.getContractAddress)(transaction);
    }
    static getInterface(contractInterface) {
        if (_ethersproject_abi__WEBPACK_IMPORTED_MODULE_10__.Interface.isInterface(contractInterface)) {
            return contractInterface;
        }
        return new _ethersproject_abi__WEBPACK_IMPORTED_MODULE_10__.Interface(contractInterface);
    }
    // @TODO: Allow timeout?
    deployed() {
        return this._deployed();
    }
    _deployed(blockTag) {
        if (!this._deployedPromise) {
            // If we were just deployed, we know the transaction we should occur in
            if (this.deployTransaction) {
                this._deployedPromise = this.deployTransaction.wait().then(() => {
                    return this;
                });
            }
            else {
                // @TODO: Once we allow a timeout to be passed in, we will wait
                // up to that many blocks for getCode
                // Otherwise, poll for our code to be deployed
                this._deployedPromise = this.provider.getCode(this.address, blockTag).then((code) => {
                    if (code === "0x") {
                        logger.throwError("contract not deployed", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                            contractAddress: this.address,
                            operation: "getDeployed"
                        });
                    }
                    return this;
                });
            }
        }
        return this._deployedPromise;
    }
    // @TODO:
    // estimateFallback(overrides?: TransactionRequest): Promise<BigNumber>
    // @TODO:
    // estimateDeploy(bytecode: string, ...args): Promise<BigNumber>
    fallback(overrides) {
        if (!this.signer) {
            logger.throwError("sending a transactions require a signer", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, { operation: "sendTransaction(fallback)" });
        }
        const tx = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.shallowCopy)(overrides || {});
        ["from", "to"].forEach(function (key) {
            if (tx[key] == null) {
                return;
            }
            logger.throwError("cannot override " + key, _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, { operation: key });
        });
        tx.to = this.resolvedAddress;
        return this.deployed().then(() => {
            return this.signer.sendTransaction(tx);
        });
    }
    // Reconnect to a different signer or provider
    connect(signerOrProvider) {
        if (typeof (signerOrProvider) === "string") {
            signerOrProvider = new _ethersproject_abstract_signer__WEBPACK_IMPORTED_MODULE_8__.VoidSigner(signerOrProvider, this.provider);
        }
        const contract = new (this.constructor)(this.address, this.interface, signerOrProvider);
        if (this.deployTransaction) {
            (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(contract, "deployTransaction", this.deployTransaction);
        }
        return contract;
    }
    // Re-attach to a different on-chain instance of this contract
    attach(addressOrName) {
        return new (this.constructor)(addressOrName, this.interface, this.signer || this.provider);
    }
    static isIndexed(value) {
        return _ethersproject_abi__WEBPACK_IMPORTED_MODULE_10__.Indexed.isIndexed(value);
    }
    _normalizeRunningEvent(runningEvent) {
        // Already have an instance of this event running; we can re-use it
        if (this._runningEvents[runningEvent.tag]) {
            return this._runningEvents[runningEvent.tag];
        }
        return runningEvent;
    }
    _getRunningEvent(eventName) {
        if (typeof (eventName) === "string") {
            // Listen for "error" events (if your contract has an error event, include
            // the full signature to bypass this special event keyword)
            if (eventName === "error") {
                return this._normalizeRunningEvent(new ErrorRunningEvent());
            }
            // Listen for any event that is registered
            if (eventName === "event") {
                return this._normalizeRunningEvent(new RunningEvent("event", null));
            }
            // Listen for any event
            if (eventName === "*") {
                return this._normalizeRunningEvent(new WildcardRunningEvent(this.address, this.interface));
            }
            // Get the event Fragment (throws if ambiguous/unknown event)
            const fragment = this.interface.getEvent(eventName);
            return this._normalizeRunningEvent(new FragmentRunningEvent(this.address, this.interface, fragment));
        }
        // We have topics to filter by...
        if (eventName.topics && eventName.topics.length > 0) {
            // Is it a known topichash? (throws if no matching topichash)
            try {
                const topic = eventName.topics[0];
                if (typeof (topic) !== "string") {
                    throw new Error("invalid topic"); // @TODO: May happen for anonymous events
                }
                const fragment = this.interface.getEvent(topic);
                return this._normalizeRunningEvent(new FragmentRunningEvent(this.address, this.interface, fragment, eventName.topics));
            }
            catch (error) { }
            // Filter by the unknown topichash
            const filter = {
                address: this.address,
                topics: eventName.topics
            };
            return this._normalizeRunningEvent(new RunningEvent(getEventTag(filter), filter));
        }
        return this._normalizeRunningEvent(new WildcardRunningEvent(this.address, this.interface));
    }
    _checkRunningEvents(runningEvent) {
        if (runningEvent.listenerCount() === 0) {
            delete this._runningEvents[runningEvent.tag];
            // If we have a poller for this, remove it
            const emit = this._wrappedEmits[runningEvent.tag];
            if (emit && runningEvent.filter) {
                this.provider.off(runningEvent.filter, emit);
                delete this._wrappedEmits[runningEvent.tag];
            }
        }
    }
    // Subclasses can override this to gracefully recover
    // from parse errors if they wish
    _wrapEvent(runningEvent, log, listener) {
        const event = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.deepCopy)(log);
        event.removeListener = () => {
            if (!listener) {
                return;
            }
            runningEvent.removeListener(listener);
            this._checkRunningEvents(runningEvent);
        };
        event.getBlock = () => { return this.provider.getBlock(log.blockHash); };
        event.getTransaction = () => { return this.provider.getTransaction(log.transactionHash); };
        event.getTransactionReceipt = () => { return this.provider.getTransactionReceipt(log.transactionHash); };
        // This may throw if the topics and data mismatch the signature
        runningEvent.prepareEvent(event);
        return event;
    }
    _addEventListener(runningEvent, listener, once) {
        if (!this.provider) {
            logger.throwError("events require a provider or a signer with a provider", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, { operation: "once" });
        }
        runningEvent.addListener(listener, once);
        // Track this running event and its listeners (may already be there; but no hard in updating)
        this._runningEvents[runningEvent.tag] = runningEvent;
        // If we are not polling the provider, start polling
        if (!this._wrappedEmits[runningEvent.tag]) {
            const wrappedEmit = (log) => {
                let event = this._wrapEvent(runningEvent, log, listener);
                // Try to emit the result for the parameterized event...
                if (event.decodeError == null) {
                    try {
                        const args = runningEvent.getEmit(event);
                        this.emit(runningEvent.filter, ...args);
                    }
                    catch (error) {
                        event.decodeError = error.error;
                    }
                }
                // Always emit "event" for fragment-base events
                if (runningEvent.filter != null) {
                    this.emit("event", event);
                }
                // Emit "error" if there was an error
                if (event.decodeError != null) {
                    this.emit("error", event.decodeError, event);
                }
            };
            this._wrappedEmits[runningEvent.tag] = wrappedEmit;
            // Special events, like "error" do not have a filter
            if (runningEvent.filter != null) {
                this.provider.on(runningEvent.filter, wrappedEmit);
            }
        }
    }
    queryFilter(event, fromBlockOrBlockhash, toBlock) {
        const runningEvent = this._getRunningEvent(event);
        const filter = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.shallowCopy)(runningEvent.filter);
        if (typeof (fromBlockOrBlockhash) === "string" && (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.isHexString)(fromBlockOrBlockhash, 32)) {
            if (toBlock != null) {
                logger.throwArgumentError("cannot specify toBlock with blockhash", "toBlock", toBlock);
            }
            filter.blockHash = fromBlockOrBlockhash;
        }
        else {
            filter.fromBlock = ((fromBlockOrBlockhash != null) ? fromBlockOrBlockhash : 0);
            filter.toBlock = ((toBlock != null) ? toBlock : "latest");
        }
        return this.provider.getLogs(filter).then((logs) => {
            return logs.map((log) => this._wrapEvent(runningEvent, log, null));
        });
    }
    on(event, listener) {
        this._addEventListener(this._getRunningEvent(event), listener, false);
        return this;
    }
    once(event, listener) {
        this._addEventListener(this._getRunningEvent(event), listener, true);
        return this;
    }
    emit(eventName, ...args) {
        if (!this.provider) {
            return false;
        }
        const runningEvent = this._getRunningEvent(eventName);
        const result = (runningEvent.run(args) > 0);
        // May have drained all the "once" events; check for living events
        this._checkRunningEvents(runningEvent);
        return result;
    }
    listenerCount(eventName) {
        if (!this.provider) {
            return 0;
        }
        if (eventName == null) {
            return Object.keys(this._runningEvents).reduce((accum, key) => {
                return accum + this._runningEvents[key].listenerCount();
            }, 0);
        }
        return this._getRunningEvent(eventName).listenerCount();
    }
    listeners(eventName) {
        if (!this.provider) {
            return [];
        }
        if (eventName == null) {
            const result = [];
            for (let tag in this._runningEvents) {
                this._runningEvents[tag].listeners().forEach((listener) => {
                    result.push(listener);
                });
            }
            return result;
        }
        return this._getRunningEvent(eventName).listeners();
    }
    removeAllListeners(eventName) {
        if (!this.provider) {
            return this;
        }
        if (eventName == null) {
            for (const tag in this._runningEvents) {
                const runningEvent = this._runningEvents[tag];
                runningEvent.removeAllListeners();
                this._checkRunningEvents(runningEvent);
            }
            return this;
        }
        // Delete any listeners
        const runningEvent = this._getRunningEvent(eventName);
        runningEvent.removeAllListeners();
        this._checkRunningEvents(runningEvent);
        return this;
    }
    off(eventName, listener) {
        if (!this.provider) {
            return this;
        }
        const runningEvent = this._getRunningEvent(eventName);
        runningEvent.removeListener(listener);
        this._checkRunningEvents(runningEvent);
        return this;
    }
    removeListener(eventName, listener) {
        return this.off(eventName, listener);
    }
}
class Contract extends BaseContract {
}
class ContractFactory {
    constructor(contractInterface, bytecode, signer) {
        let bytecodeHex = null;
        if (typeof (bytecode) === "string") {
            bytecodeHex = bytecode;
        }
        else if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.isBytes)(bytecode)) {
            bytecodeHex = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexlify)(bytecode);
        }
        else if (bytecode && typeof (bytecode.object) === "string") {
            // Allow the bytecode object from the Solidity compiler
            bytecodeHex = bytecode.object;
        }
        else {
            // Crash in the next verification step
            bytecodeHex = "!";
        }
        // Make sure it is 0x prefixed
        if (bytecodeHex.substring(0, 2) !== "0x") {
            bytecodeHex = "0x" + bytecodeHex;
        }
        // Make sure the final result is valid bytecode
        if (!(0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.isHexString)(bytecodeHex) || (bytecodeHex.length % 2)) {
            logger.throwArgumentError("invalid bytecode", "bytecode", bytecode);
        }
        // If we have a signer, make sure it is valid
        if (signer && !_ethersproject_abstract_signer__WEBPACK_IMPORTED_MODULE_8__.Signer.isSigner(signer)) {
            logger.throwArgumentError("invalid signer", "signer", signer);
        }
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "bytecode", bytecodeHex);
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "interface", (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.getStatic)(new.target, "getInterface")(contractInterface));
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "signer", signer || null);
    }
    // @TODO: Future; rename to populateTransaction?
    getDeployTransaction(...args) {
        let tx = {};
        // If we have 1 additional argument, we allow transaction overrides
        if (args.length === this.interface.deploy.inputs.length + 1 && typeof (args[args.length - 1]) === "object") {
            tx = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.shallowCopy)(args.pop());
            for (const key in tx) {
                if (!allowedTransactionKeys[key]) {
                    throw new Error("unknown transaction override " + key);
                }
            }
        }
        // Do not allow these to be overridden in a deployment transaction
        ["data", "from", "to"].forEach((key) => {
            if (tx[key] == null) {
                return;
            }
            logger.throwError("cannot override " + key, _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, { operation: key });
        });
        if (tx.value) {
            const value = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(tx.value);
            if (!value.isZero() && !this.interface.deploy.payable) {
                logger.throwError("non-payable constructor cannot override value", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "overrides.value",
                    value: tx.value
                });
            }
        }
        // Make sure the call matches the constructor signature
        logger.checkArgumentCount(args.length, this.interface.deploy.inputs.length, " in Contract constructor");
        // Set the data to the bytecode + the encoded constructor arguments
        tx.data = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexlify)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.concat)([
            this.bytecode,
            this.interface.encodeDeploy(args)
        ]));
        return tx;
    }
    deploy(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            let overrides = {};
            // If 1 extra parameter was passed in, it contains overrides
            if (args.length === this.interface.deploy.inputs.length + 1) {
                overrides = args.pop();
            }
            // Make sure the call matches the constructor signature
            logger.checkArgumentCount(args.length, this.interface.deploy.inputs.length, " in Contract constructor");
            // Resolve ENS names and promises in the arguments
            const params = yield resolveAddresses(this.signer, args, this.interface.deploy.inputs);
            params.push(overrides);
            // Get the deployment transaction (with optional overrides)
            const unsignedTx = this.getDeployTransaction(...params);
            // Send the deployment transaction
            const tx = yield this.signer.sendTransaction(unsignedTx);
            const address = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.getStatic)(this.constructor, "getContractAddress")(tx);
            const contract = (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.getStatic)(this.constructor, "getContract")(address, this.interface, this.signer);
            // Add the modified wait that wraps events
            addContractWait(contract, tx);
            (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(contract, "deployTransaction", tx);
            return contract;
        });
    }
    attach(address) {
        return (this.constructor).getContract(address, this.interface, this.signer);
    }
    connect(signer) {
        return new (this.constructor)(this.interface, this.bytecode, signer);
    }
    static fromSolidity(compilerOutput, signer) {
        if (compilerOutput == null) {
            logger.throwError("missing compiler output", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.MISSING_ARGUMENT, { argument: "compilerOutput" });
        }
        if (typeof (compilerOutput) === "string") {
            compilerOutput = JSON.parse(compilerOutput);
        }
        const abi = compilerOutput.abi;
        let bytecode = null;
        if (compilerOutput.bytecode) {
            bytecode = compilerOutput.bytecode;
        }
        else if (compilerOutput.evm && compilerOutput.evm.bytecode) {
            bytecode = compilerOutput.evm.bytecode;
        }
        return new this(abi, bytecode, signer);
    }
    static getInterface(contractInterface) {
        return Contract.getInterface(contractInterface);
    }
    static getContractAddress(tx) {
        return (0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_2__.getContractAddress)(tx);
    }
    static getContract(address, contractInterface, signer) {
        return new Contract(address, contractInterface, signer);
    }
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/hash/lib.esm/id.js":
/*!********************************************************!*\
  !*** ./node_modules/@ethersproject/hash/lib.esm/id.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "id": () => (/* binding */ id)
/* harmony export */ });
/* harmony import */ var _ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/keccak256 */ "./node_modules/@ethersproject/keccak256/lib.esm/index.js");
/* harmony import */ var _ethersproject_strings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ethersproject/strings */ "./node_modules/@ethersproject/strings/lib.esm/utf8.js");


function id(text) {
    return (0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_0__.keccak256)((0,_ethersproject_strings__WEBPACK_IMPORTED_MODULE_1__.toUtf8Bytes)(text));
}
//# sourceMappingURL=id.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/keccak256/lib.esm/index.js":
/*!****************************************************************!*\
  !*** ./node_modules/@ethersproject/keccak256/lib.esm/index.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "keccak256": () => (/* binding */ keccak256)
/* harmony export */ });
/* harmony import */ var js_sha3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! js-sha3 */ "./node_modules/js-sha3/src/sha3.js");
/* harmony import */ var js_sha3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(js_sha3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");



function keccak256(data) {
    return '0x' + js_sha3__WEBPACK_IMPORTED_MODULE_0___default().keccak_256((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__.arrayify)(data));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/logger/lib.esm/_version.js":
/*!****************************************************************!*\
  !*** ./node_modules/@ethersproject/logger/lib.esm/_version.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "logger/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/logger/lib.esm/index.js":
/*!*************************************************************!*\
  !*** ./node_modules/@ethersproject/logger/lib.esm/index.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ErrorCode": () => (/* binding */ ErrorCode),
/* harmony export */   "LogLevel": () => (/* binding */ LogLevel),
/* harmony export */   "Logger": () => (/* binding */ Logger)
/* harmony export */ });
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/logger/lib.esm/_version.js");

let _permanentCensorErrors = false;
let _censorErrors = false;
const LogLevels = { debug: 1, "default": 2, info: 2, warning: 3, error: 4, off: 5 };
let _logLevel = LogLevels["default"];

let _globalLogger = null;
function _checkNormalize() {
    try {
        const missing = [];
        // Make sure all forms of normalization are supported
        ["NFD", "NFC", "NFKD", "NFKC"].forEach((form) => {
            try {
                if ("test".normalize(form) !== "test") {
                    throw new Error("bad normalize");
                }
                ;
            }
            catch (error) {
                missing.push(form);
            }
        });
        if (missing.length) {
            throw new Error("missing " + missing.join(", "));
        }
        if (String.fromCharCode(0xe9).normalize("NFD") !== String.fromCharCode(0x65, 0x0301)) {
            throw new Error("broken implementation");
        }
    }
    catch (error) {
        return error.message;
    }
    return null;
}
const _normalizeError = _checkNormalize();
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARNING"] = "WARNING";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["OFF"] = "OFF";
})(LogLevel || (LogLevel = {}));
var ErrorCode;
(function (ErrorCode) {
    ///////////////////
    // Generic Errors
    // Unknown Error
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    // Not Implemented
    ErrorCode["NOT_IMPLEMENTED"] = "NOT_IMPLEMENTED";
    // Unsupported Operation
    //   - operation
    ErrorCode["UNSUPPORTED_OPERATION"] = "UNSUPPORTED_OPERATION";
    // Network Error (i.e. Ethereum Network, such as an invalid chain ID)
    //   - event ("noNetwork" is not re-thrown in provider.ready; otherwise thrown)
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    // Some sort of bad response from the server
    ErrorCode["SERVER_ERROR"] = "SERVER_ERROR";
    // Timeout
    ErrorCode["TIMEOUT"] = "TIMEOUT";
    ///////////////////
    // Operational  Errors
    // Buffer Overrun
    ErrorCode["BUFFER_OVERRUN"] = "BUFFER_OVERRUN";
    // Numeric Fault
    //   - operation: the operation being executed
    //   - fault: the reason this faulted
    ErrorCode["NUMERIC_FAULT"] = "NUMERIC_FAULT";
    ///////////////////
    // Argument Errors
    // Missing new operator to an object
    //  - name: The name of the class
    ErrorCode["MISSING_NEW"] = "MISSING_NEW";
    // Invalid argument (e.g. value is incompatible with type) to a function:
    //   - argument: The argument name that was invalid
    //   - value: The value of the argument
    ErrorCode["INVALID_ARGUMENT"] = "INVALID_ARGUMENT";
    // Missing argument to a function:
    //   - count: The number of arguments received
    //   - expectedCount: The number of arguments expected
    ErrorCode["MISSING_ARGUMENT"] = "MISSING_ARGUMENT";
    // Too many arguments
    //   - count: The number of arguments received
    //   - expectedCount: The number of arguments expected
    ErrorCode["UNEXPECTED_ARGUMENT"] = "UNEXPECTED_ARGUMENT";
    ///////////////////
    // Blockchain Errors
    // Call exception
    //  - transaction: the transaction
    //  - address?: the contract address
    //  - args?: The arguments passed into the function
    //  - method?: The Solidity method signature
    //  - errorSignature?: The EIP848 error signature
    //  - errorArgs?: The EIP848 error parameters
    //  - reason: The reason (only for EIP848 "Error(string)")
    ErrorCode["CALL_EXCEPTION"] = "CALL_EXCEPTION";
    // Insufficient funds (< value + gasLimit * gasPrice)
    //   - transaction: the transaction attempted
    ErrorCode["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
    // Nonce has already been used
    //   - transaction: the transaction attempted
    ErrorCode["NONCE_EXPIRED"] = "NONCE_EXPIRED";
    // The replacement fee for the transaction is too low
    //   - transaction: the transaction attempted
    ErrorCode["REPLACEMENT_UNDERPRICED"] = "REPLACEMENT_UNDERPRICED";
    // The gas limit could not be estimated
    //   - transaction: the transaction passed to estimateGas
    ErrorCode["UNPREDICTABLE_GAS_LIMIT"] = "UNPREDICTABLE_GAS_LIMIT";
    // The transaction was replaced by one with a higher gas price
    //   - reason: "cancelled", "replaced" or "repriced"
    //   - cancelled: true if reason == "cancelled" or reason == "replaced")
    //   - hash: original transaction hash
    //   - replacement: the full TransactionsResponse for the replacement
    //   - receipt: the receipt of the replacement
    ErrorCode["TRANSACTION_REPLACED"] = "TRANSACTION_REPLACED";
    ///////////////////
    // Interaction Errors
    // The user rejected the action, such as signing a message or sending
    // a transaction
    ErrorCode["ACTION_REJECTED"] = "ACTION_REJECTED";
})(ErrorCode || (ErrorCode = {}));
;
const HEX = "0123456789abcdef";
class Logger {
    constructor(version) {
        Object.defineProperty(this, "version", {
            enumerable: true,
            value: version,
            writable: false
        });
    }
    _log(logLevel, args) {
        const level = logLevel.toLowerCase();
        if (LogLevels[level] == null) {
            this.throwArgumentError("invalid log level name", "logLevel", logLevel);
        }
        if (_logLevel > LogLevels[level]) {
            return;
        }
        console.log.apply(console, args);
    }
    debug(...args) {
        this._log(Logger.levels.DEBUG, args);
    }
    info(...args) {
        this._log(Logger.levels.INFO, args);
    }
    warn(...args) {
        this._log(Logger.levels.WARNING, args);
    }
    makeError(message, code, params) {
        // Errors are being censored
        if (_censorErrors) {
            return this.makeError("censored error", code, {});
        }
        if (!code) {
            code = Logger.errors.UNKNOWN_ERROR;
        }
        if (!params) {
            params = {};
        }
        const messageDetails = [];
        Object.keys(params).forEach((key) => {
            const value = params[key];
            try {
                if (value instanceof Uint8Array) {
                    let hex = "";
                    for (let i = 0; i < value.length; i++) {
                        hex += HEX[value[i] >> 4];
                        hex += HEX[value[i] & 0x0f];
                    }
                    messageDetails.push(key + "=Uint8Array(0x" + hex + ")");
                }
                else {
                    messageDetails.push(key + "=" + JSON.stringify(value));
                }
            }
            catch (error) {
                messageDetails.push(key + "=" + JSON.stringify(params[key].toString()));
            }
        });
        messageDetails.push(`code=${code}`);
        messageDetails.push(`version=${this.version}`);
        const reason = message;
        let url = "";
        switch (code) {
            case ErrorCode.NUMERIC_FAULT: {
                url = "NUMERIC_FAULT";
                const fault = message;
                switch (fault) {
                    case "overflow":
                    case "underflow":
                    case "division-by-zero":
                        url += "-" + fault;
                        break;
                    case "negative-power":
                    case "negative-width":
                        url += "-unsupported";
                        break;
                    case "unbound-bitwise-result":
                        url += "-unbound-result";
                        break;
                }
                break;
            }
            case ErrorCode.CALL_EXCEPTION:
            case ErrorCode.INSUFFICIENT_FUNDS:
            case ErrorCode.MISSING_NEW:
            case ErrorCode.NONCE_EXPIRED:
            case ErrorCode.REPLACEMENT_UNDERPRICED:
            case ErrorCode.TRANSACTION_REPLACED:
            case ErrorCode.UNPREDICTABLE_GAS_LIMIT:
                url = code;
                break;
        }
        if (url) {
            message += " [ See: https:/\/links.ethers.org/v5-errors-" + url + " ]";
        }
        if (messageDetails.length) {
            message += " (" + messageDetails.join(", ") + ")";
        }
        // @TODO: Any??
        const error = new Error(message);
        error.reason = reason;
        error.code = code;
        Object.keys(params).forEach(function (key) {
            error[key] = params[key];
        });
        return error;
    }
    throwError(message, code, params) {
        throw this.makeError(message, code, params);
    }
    throwArgumentError(message, name, value) {
        return this.throwError(message, Logger.errors.INVALID_ARGUMENT, {
            argument: name,
            value: value
        });
    }
    assert(condition, message, code, params) {
        if (!!condition) {
            return;
        }
        this.throwError(message, code, params);
    }
    assertArgument(condition, message, name, value) {
        if (!!condition) {
            return;
        }
        this.throwArgumentError(message, name, value);
    }
    checkNormalize(message) {
        if (message == null) {
            message = "platform missing String.prototype.normalize";
        }
        if (_normalizeError) {
            this.throwError("platform missing String.prototype.normalize", Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "String.prototype.normalize", form: _normalizeError
            });
        }
    }
    checkSafeUint53(value, message) {
        if (typeof (value) !== "number") {
            return;
        }
        if (message == null) {
            message = "value not safe";
        }
        if (value < 0 || value >= 0x1fffffffffffff) {
            this.throwError(message, Logger.errors.NUMERIC_FAULT, {
                operation: "checkSafeInteger",
                fault: "out-of-safe-range",
                value: value
            });
        }
        if (value % 1) {
            this.throwError(message, Logger.errors.NUMERIC_FAULT, {
                operation: "checkSafeInteger",
                fault: "non-integer",
                value: value
            });
        }
    }
    checkArgumentCount(count, expectedCount, message) {
        if (message) {
            message = ": " + message;
        }
        else {
            message = "";
        }
        if (count < expectedCount) {
            this.throwError("missing argument" + message, Logger.errors.MISSING_ARGUMENT, {
                count: count,
                expectedCount: expectedCount
            });
        }
        if (count > expectedCount) {
            this.throwError("too many arguments" + message, Logger.errors.UNEXPECTED_ARGUMENT, {
                count: count,
                expectedCount: expectedCount
            });
        }
    }
    checkNew(target, kind) {
        if (target === Object || target == null) {
            this.throwError("missing new", Logger.errors.MISSING_NEW, { name: kind.name });
        }
    }
    checkAbstract(target, kind) {
        if (target === kind) {
            this.throwError("cannot instantiate abstract class " + JSON.stringify(kind.name) + " directly; use a sub-class", Logger.errors.UNSUPPORTED_OPERATION, { name: target.name, operation: "new" });
        }
        else if (target === Object || target == null) {
            this.throwError("missing new", Logger.errors.MISSING_NEW, { name: kind.name });
        }
    }
    static globalLogger() {
        if (!_globalLogger) {
            _globalLogger = new Logger(_version__WEBPACK_IMPORTED_MODULE_0__.version);
        }
        return _globalLogger;
    }
    static setCensorship(censorship, permanent) {
        if (!censorship && permanent) {
            this.globalLogger().throwError("cannot permanently disable censorship", Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "setCensorship"
            });
        }
        if (_permanentCensorErrors) {
            if (!censorship) {
                return;
            }
            this.globalLogger().throwError("error censorship permanent", Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "setCensorship"
            });
        }
        _censorErrors = !!censorship;
        _permanentCensorErrors = !!permanent;
    }
    static setLogLevel(logLevel) {
        const level = LogLevels[logLevel.toLowerCase()];
        if (level == null) {
            Logger.globalLogger().warn("invalid log level - " + logLevel);
            return;
        }
        _logLevel = level;
    }
    static from(version) {
        return new Logger(version);
    }
}
Logger.errors = ErrorCode;
Logger.levels = LogLevel;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/properties/lib.esm/_version.js":
/*!********************************************************************!*\
  !*** ./node_modules/@ethersproject/properties/lib.esm/_version.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "properties/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/properties/lib.esm/index.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@ethersproject/properties/lib.esm/index.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Description": () => (/* binding */ Description),
/* harmony export */   "checkProperties": () => (/* binding */ checkProperties),
/* harmony export */   "deepCopy": () => (/* binding */ deepCopy),
/* harmony export */   "defineReadOnly": () => (/* binding */ defineReadOnly),
/* harmony export */   "getStatic": () => (/* binding */ getStatic),
/* harmony export */   "resolveProperties": () => (/* binding */ resolveProperties),
/* harmony export */   "shallowCopy": () => (/* binding */ shallowCopy)
/* harmony export */ });
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/properties/lib.esm/_version.js");

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
function defineReadOnly(object, name, value) {
    Object.defineProperty(object, name, {
        enumerable: true,
        value: value,
        writable: false,
    });
}
// Crawl up the constructor chain to find a static method
function getStatic(ctor, key) {
    for (let i = 0; i < 32; i++) {
        if (ctor[key]) {
            return ctor[key];
        }
        if (!ctor.prototype || typeof (ctor.prototype) !== "object") {
            break;
        }
        ctor = Object.getPrototypeOf(ctor.prototype).constructor;
    }
    return null;
}
function resolveProperties(object) {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = Object.keys(object).map((key) => {
            const value = object[key];
            return Promise.resolve(value).then((v) => ({ key: key, value: v }));
        });
        const results = yield Promise.all(promises);
        return results.reduce((accum, result) => {
            accum[(result.key)] = result.value;
            return accum;
        }, {});
    });
}
function checkProperties(object, properties) {
    if (!object || typeof (object) !== "object") {
        logger.throwArgumentError("invalid object", "object", object);
    }
    Object.keys(object).forEach((key) => {
        if (!properties[key]) {
            logger.throwArgumentError("invalid object key - " + key, "transaction:" + key, object);
        }
    });
}
function shallowCopy(object) {
    const result = {};
    for (const key in object) {
        result[key] = object[key];
    }
    return result;
}
const opaque = { bigint: true, boolean: true, "function": true, number: true, string: true };
function _isFrozen(object) {
    // Opaque objects are not mutable, so safe to copy by assignment
    if (object === undefined || object === null || opaque[typeof (object)]) {
        return true;
    }
    if (Array.isArray(object) || typeof (object) === "object") {
        if (!Object.isFrozen(object)) {
            return false;
        }
        const keys = Object.keys(object);
        for (let i = 0; i < keys.length; i++) {
            let value = null;
            try {
                value = object[keys[i]];
            }
            catch (error) {
                // If accessing a value triggers an error, it is a getter
                // designed to do so (e.g. Result) and is therefore "frozen"
                continue;
            }
            if (!_isFrozen(value)) {
                return false;
            }
        }
        return true;
    }
    return logger.throwArgumentError(`Cannot deepCopy ${typeof (object)}`, "object", object);
}
// Returns a new copy of object, such that no properties may be replaced.
// New properties may be added only to objects.
function _deepCopy(object) {
    if (_isFrozen(object)) {
        return object;
    }
    // Arrays are mutable, so we need to create a copy
    if (Array.isArray(object)) {
        return Object.freeze(object.map((item) => deepCopy(item)));
    }
    if (typeof (object) === "object") {
        const result = {};
        for (const key in object) {
            const value = object[key];
            if (value === undefined) {
                continue;
            }
            defineReadOnly(result, key, deepCopy(value));
        }
        return result;
    }
    return logger.throwArgumentError(`Cannot deepCopy ${typeof (object)}`, "object", object);
}
function deepCopy(object) {
    return _deepCopy(object);
}
class Description {
    constructor(info) {
        for (const key in info) {
            this[key] = deepCopy(info[key]);
        }
    }
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/rlp/lib.esm/_version.js":
/*!*************************************************************!*\
  !*** ./node_modules/@ethersproject/rlp/lib.esm/_version.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "rlp/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/rlp/lib.esm/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/@ethersproject/rlp/lib.esm/index.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "decode": () => (/* binding */ decode),
/* harmony export */   "encode": () => (/* binding */ encode)
/* harmony export */ });
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/rlp/lib.esm/_version.js");

//See: https://github.com/ethereum/wiki/wiki/RLP



const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
function arrayifyInteger(value) {
    const result = [];
    while (value) {
        result.unshift(value & 0xff);
        value >>= 8;
    }
    return result;
}
function unarrayifyInteger(data, offset, length) {
    let result = 0;
    for (let i = 0; i < length; i++) {
        result = (result * 256) + data[offset + i];
    }
    return result;
}
function _encode(object) {
    if (Array.isArray(object)) {
        let payload = [];
        object.forEach(function (child) {
            payload = payload.concat(_encode(child));
        });
        if (payload.length <= 55) {
            payload.unshift(0xc0 + payload.length);
            return payload;
        }
        const length = arrayifyInteger(payload.length);
        length.unshift(0xf7 + length.length);
        return length.concat(payload);
    }
    if (!(0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.isBytesLike)(object)) {
        logger.throwArgumentError("RLP object must be BytesLike", "object", object);
    }
    const data = Array.prototype.slice.call((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.arrayify)(object));
    if (data.length === 1 && data[0] <= 0x7f) {
        return data;
    }
    else if (data.length <= 55) {
        data.unshift(0x80 + data.length);
        return data;
    }
    const length = arrayifyInteger(data.length);
    length.unshift(0xb7 + length.length);
    return length.concat(data);
}
function encode(object) {
    return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.hexlify)(_encode(object));
}
function _decodeChildren(data, offset, childOffset, length) {
    const result = [];
    while (childOffset < offset + 1 + length) {
        const decoded = _decode(data, childOffset);
        result.push(decoded.result);
        childOffset += decoded.consumed;
        if (childOffset > offset + 1 + length) {
            logger.throwError("child data too short", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN, {});
        }
    }
    return { consumed: (1 + length), result: result };
}
// returns { consumed: number, result: Object }
function _decode(data, offset) {
    if (data.length === 0) {
        logger.throwError("data too short", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN, {});
    }
    // Array with extra length prefix
    if (data[offset] >= 0xf8) {
        const lengthLength = data[offset] - 0xf7;
        if (offset + 1 + lengthLength > data.length) {
            logger.throwError("data short segment too short", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN, {});
        }
        const length = unarrayifyInteger(data, offset + 1, lengthLength);
        if (offset + 1 + lengthLength + length > data.length) {
            logger.throwError("data long segment too short", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN, {});
        }
        return _decodeChildren(data, offset, offset + 1 + lengthLength, lengthLength + length);
    }
    else if (data[offset] >= 0xc0) {
        const length = data[offset] - 0xc0;
        if (offset + 1 + length > data.length) {
            logger.throwError("data array too short", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN, {});
        }
        return _decodeChildren(data, offset, offset + 1, length);
    }
    else if (data[offset] >= 0xb8) {
        const lengthLength = data[offset] - 0xb7;
        if (offset + 1 + lengthLength > data.length) {
            logger.throwError("data array too short", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN, {});
        }
        const length = unarrayifyInteger(data, offset + 1, lengthLength);
        if (offset + 1 + lengthLength + length > data.length) {
            logger.throwError("data array too short", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN, {});
        }
        const result = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.hexlify)(data.slice(offset + 1 + lengthLength, offset + 1 + lengthLength + length));
        return { consumed: (1 + lengthLength + length), result: result };
    }
    else if (data[offset] >= 0x80) {
        const length = data[offset] - 0x80;
        if (offset + 1 + length > data.length) {
            logger.throwError("data too short", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.BUFFER_OVERRUN, {});
        }
        const result = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.hexlify)(data.slice(offset + 1, offset + 1 + length));
        return { consumed: (1 + length), result: result };
    }
    return { consumed: 1, result: (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.hexlify)(data[offset]) };
}
function decode(data) {
    const bytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.arrayify)(data);
    const decoded = _decode(bytes, 0);
    if (decoded.consumed !== bytes.length) {
        logger.throwArgumentError("invalid rlp data", "data", data);
    }
    return decoded.result;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/signing-key/lib.esm/_version.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@ethersproject/signing-key/lib.esm/_version.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "signing-key/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/signing-key/lib.esm/elliptic.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@ethersproject/signing-key/lib.esm/elliptic.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EC": () => (/* binding */ EC$1)
/* harmony export */ });
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! bn.js */ "./node_modules/bn.js/lib/bn.js");
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(bn_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var hash_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! hash.js */ "./node_modules/hash.js/lib/hash.js");
/* harmony import */ var hash_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(hash_js__WEBPACK_IMPORTED_MODULE_1__);



var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof __webpack_require__.g !== 'undefined' ? __webpack_require__.g : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

function getDefaultExportFromNamespaceIfPresent (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') ? n['default'] : n;
}

function getDefaultExportFromNamespaceIfNotNamed (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
}

function getAugmentedNamespace(n) {
	if (n.__esModule) return n;
	var a = Object.defineProperty({}, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var minimalisticAssert = assert;

function assert(val, msg) {
  if (!val)
    throw new Error(msg || 'Assertion failed');
}

assert.equal = function assertEqual(l, r, msg) {
  if (l != r)
    throw new Error(msg || ('Assertion failed: ' + l + ' != ' + r));
};

var utils_1 = createCommonjsModule(function (module, exports) {
'use strict';

var utils = exports;

function toArray(msg, enc) {
  if (Array.isArray(msg))
    return msg.slice();
  if (!msg)
    return [];
  var res = [];
  if (typeof msg !== 'string') {
    for (var i = 0; i < msg.length; i++)
      res[i] = msg[i] | 0;
    return res;
  }
  if (enc === 'hex') {
    msg = msg.replace(/[^a-z0-9]+/ig, '');
    if (msg.length % 2 !== 0)
      msg = '0' + msg;
    for (var i = 0; i < msg.length; i += 2)
      res.push(parseInt(msg[i] + msg[i + 1], 16));
  } else {
    for (var i = 0; i < msg.length; i++) {
      var c = msg.charCodeAt(i);
      var hi = c >> 8;
      var lo = c & 0xff;
      if (hi)
        res.push(hi, lo);
      else
        res.push(lo);
    }
  }
  return res;
}
utils.toArray = toArray;

function zero2(word) {
  if (word.length === 1)
    return '0' + word;
  else
    return word;
}
utils.zero2 = zero2;

function toHex(msg) {
  var res = '';
  for (var i = 0; i < msg.length; i++)
    res += zero2(msg[i].toString(16));
  return res;
}
utils.toHex = toHex;

utils.encode = function encode(arr, enc) {
  if (enc === 'hex')
    return toHex(arr);
  else
    return arr;
};
});

var utils_1$1 = createCommonjsModule(function (module, exports) {
'use strict';

var utils = exports;




utils.assert = minimalisticAssert;
utils.toArray = utils_1.toArray;
utils.zero2 = utils_1.zero2;
utils.toHex = utils_1.toHex;
utils.encode = utils_1.encode;

// Represent num in a w-NAF form
function getNAF(num, w, bits) {
  var naf = new Array(Math.max(num.bitLength(), bits) + 1);
  naf.fill(0);

  var ws = 1 << (w + 1);
  var k = num.clone();

  for (var i = 0; i < naf.length; i++) {
    var z;
    var mod = k.andln(ws - 1);
    if (k.isOdd()) {
      if (mod > (ws >> 1) - 1)
        z = (ws >> 1) - mod;
      else
        z = mod;
      k.isubn(z);
    } else {
      z = 0;
    }

    naf[i] = z;
    k.iushrn(1);
  }

  return naf;
}
utils.getNAF = getNAF;

// Represent k1, k2 in a Joint Sparse Form
function getJSF(k1, k2) {
  var jsf = [
    [],
    [],
  ];

  k1 = k1.clone();
  k2 = k2.clone();
  var d1 = 0;
  var d2 = 0;
  var m8;
  while (k1.cmpn(-d1) > 0 || k2.cmpn(-d2) > 0) {
    // First phase
    var m14 = (k1.andln(3) + d1) & 3;
    var m24 = (k2.andln(3) + d2) & 3;
    if (m14 === 3)
      m14 = -1;
    if (m24 === 3)
      m24 = -1;
    var u1;
    if ((m14 & 1) === 0) {
      u1 = 0;
    } else {
      m8 = (k1.andln(7) + d1) & 7;
      if ((m8 === 3 || m8 === 5) && m24 === 2)
        u1 = -m14;
      else
        u1 = m14;
    }
    jsf[0].push(u1);

    var u2;
    if ((m24 & 1) === 0) {
      u2 = 0;
    } else {
      m8 = (k2.andln(7) + d2) & 7;
      if ((m8 === 3 || m8 === 5) && m14 === 2)
        u2 = -m24;
      else
        u2 = m24;
    }
    jsf[1].push(u2);

    // Second phase
    if (2 * d1 === u1 + 1)
      d1 = 1 - d1;
    if (2 * d2 === u2 + 1)
      d2 = 1 - d2;
    k1.iushrn(1);
    k2.iushrn(1);
  }

  return jsf;
}
utils.getJSF = getJSF;

function cachedProperty(obj, name, computer) {
  var key = '_' + name;
  obj.prototype[name] = function cachedProperty() {
    return this[key] !== undefined ? this[key] :
      this[key] = computer.call(this);
  };
}
utils.cachedProperty = cachedProperty;

function parseBytes(bytes) {
  return typeof bytes === 'string' ? utils.toArray(bytes, 'hex') :
    bytes;
}
utils.parseBytes = parseBytes;

function intFromLE(bytes) {
  return new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(bytes, 'hex', 'le');
}
utils.intFromLE = intFromLE;
});

'use strict';



var getNAF = utils_1$1.getNAF;
var getJSF = utils_1$1.getJSF;
var assert$1 = utils_1$1.assert;

function BaseCurve(type, conf) {
  this.type = type;
  this.p = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(conf.p, 16);

  // Use Montgomery, when there is no fast reduction for the prime
  this.red = conf.prime ? bn_js__WEBPACK_IMPORTED_MODULE_0___default().red(conf.prime) : bn_js__WEBPACK_IMPORTED_MODULE_0___default().mont(this.p);

  // Useful for many curves
  this.zero = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(0).toRed(this.red);
  this.one = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(1).toRed(this.red);
  this.two = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(2).toRed(this.red);

  // Curve configuration, optional
  this.n = conf.n && new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(conf.n, 16);
  this.g = conf.g && this.pointFromJSON(conf.g, conf.gRed);

  // Temporary arrays
  this._wnafT1 = new Array(4);
  this._wnafT2 = new Array(4);
  this._wnafT3 = new Array(4);
  this._wnafT4 = new Array(4);

  this._bitLength = this.n ? this.n.bitLength() : 0;

  // Generalized Greg Maxwell's trick
  var adjustCount = this.n && this.p.div(this.n);
  if (!adjustCount || adjustCount.cmpn(100) > 0) {
    this.redN = null;
  } else {
    this._maxwellTrick = true;
    this.redN = this.n.toRed(this.red);
  }
}
var base = BaseCurve;

BaseCurve.prototype.point = function point() {
  throw new Error('Not implemented');
};

BaseCurve.prototype.validate = function validate() {
  throw new Error('Not implemented');
};

BaseCurve.prototype._fixedNafMul = function _fixedNafMul(p, k) {
  assert$1(p.precomputed);
  var doubles = p._getDoubles();

  var naf = getNAF(k, 1, this._bitLength);
  var I = (1 << (doubles.step + 1)) - (doubles.step % 2 === 0 ? 2 : 1);
  I /= 3;

  // Translate into more windowed form
  var repr = [];
  var j;
  var nafW;
  for (j = 0; j < naf.length; j += doubles.step) {
    nafW = 0;
    for (var l = j + doubles.step - 1; l >= j; l--)
      nafW = (nafW << 1) + naf[l];
    repr.push(nafW);
  }

  var a = this.jpoint(null, null, null);
  var b = this.jpoint(null, null, null);
  for (var i = I; i > 0; i--) {
    for (j = 0; j < repr.length; j++) {
      nafW = repr[j];
      if (nafW === i)
        b = b.mixedAdd(doubles.points[j]);
      else if (nafW === -i)
        b = b.mixedAdd(doubles.points[j].neg());
    }
    a = a.add(b);
  }
  return a.toP();
};

BaseCurve.prototype._wnafMul = function _wnafMul(p, k) {
  var w = 4;

  // Precompute window
  var nafPoints = p._getNAFPoints(w);
  w = nafPoints.wnd;
  var wnd = nafPoints.points;

  // Get NAF form
  var naf = getNAF(k, w, this._bitLength);

  // Add `this`*(N+1) for every w-NAF index
  var acc = this.jpoint(null, null, null);
  for (var i = naf.length - 1; i >= 0; i--) {
    // Count zeroes
    for (var l = 0; i >= 0 && naf[i] === 0; i--)
      l++;
    if (i >= 0)
      l++;
    acc = acc.dblp(l);

    if (i < 0)
      break;
    var z = naf[i];
    assert$1(z !== 0);
    if (p.type === 'affine') {
      // J +- P
      if (z > 0)
        acc = acc.mixedAdd(wnd[(z - 1) >> 1]);
      else
        acc = acc.mixedAdd(wnd[(-z - 1) >> 1].neg());
    } else {
      // J +- J
      if (z > 0)
        acc = acc.add(wnd[(z - 1) >> 1]);
      else
        acc = acc.add(wnd[(-z - 1) >> 1].neg());
    }
  }
  return p.type === 'affine' ? acc.toP() : acc;
};

BaseCurve.prototype._wnafMulAdd = function _wnafMulAdd(defW,
  points,
  coeffs,
  len,
  jacobianResult) {
  var wndWidth = this._wnafT1;
  var wnd = this._wnafT2;
  var naf = this._wnafT3;

  // Fill all arrays
  var max = 0;
  var i;
  var j;
  var p;
  for (i = 0; i < len; i++) {
    p = points[i];
    var nafPoints = p._getNAFPoints(defW);
    wndWidth[i] = nafPoints.wnd;
    wnd[i] = nafPoints.points;
  }

  // Comb small window NAFs
  for (i = len - 1; i >= 1; i -= 2) {
    var a = i - 1;
    var b = i;
    if (wndWidth[a] !== 1 || wndWidth[b] !== 1) {
      naf[a] = getNAF(coeffs[a], wndWidth[a], this._bitLength);
      naf[b] = getNAF(coeffs[b], wndWidth[b], this._bitLength);
      max = Math.max(naf[a].length, max);
      max = Math.max(naf[b].length, max);
      continue;
    }

    var comb = [
      points[a], /* 1 */
      null, /* 3 */
      null, /* 5 */
      points[b], /* 7 */
    ];

    // Try to avoid Projective points, if possible
    if (points[a].y.cmp(points[b].y) === 0) {
      comb[1] = points[a].add(points[b]);
      comb[2] = points[a].toJ().mixedAdd(points[b].neg());
    } else if (points[a].y.cmp(points[b].y.redNeg()) === 0) {
      comb[1] = points[a].toJ().mixedAdd(points[b]);
      comb[2] = points[a].add(points[b].neg());
    } else {
      comb[1] = points[a].toJ().mixedAdd(points[b]);
      comb[2] = points[a].toJ().mixedAdd(points[b].neg());
    }

    var index = [
      -3, /* -1 -1 */
      -1, /* -1 0 */
      -5, /* -1 1 */
      -7, /* 0 -1 */
      0, /* 0 0 */
      7, /* 0 1 */
      5, /* 1 -1 */
      1, /* 1 0 */
      3,  /* 1 1 */
    ];

    var jsf = getJSF(coeffs[a], coeffs[b]);
    max = Math.max(jsf[0].length, max);
    naf[a] = new Array(max);
    naf[b] = new Array(max);
    for (j = 0; j < max; j++) {
      var ja = jsf[0][j] | 0;
      var jb = jsf[1][j] | 0;

      naf[a][j] = index[(ja + 1) * 3 + (jb + 1)];
      naf[b][j] = 0;
      wnd[a] = comb;
    }
  }

  var acc = this.jpoint(null, null, null);
  var tmp = this._wnafT4;
  for (i = max; i >= 0; i--) {
    var k = 0;

    while (i >= 0) {
      var zero = true;
      for (j = 0; j < len; j++) {
        tmp[j] = naf[j][i] | 0;
        if (tmp[j] !== 0)
          zero = false;
      }
      if (!zero)
        break;
      k++;
      i--;
    }
    if (i >= 0)
      k++;
    acc = acc.dblp(k);
    if (i < 0)
      break;

    for (j = 0; j < len; j++) {
      var z = tmp[j];
      p;
      if (z === 0)
        continue;
      else if (z > 0)
        p = wnd[j][(z - 1) >> 1];
      else if (z < 0)
        p = wnd[j][(-z - 1) >> 1].neg();

      if (p.type === 'affine')
        acc = acc.mixedAdd(p);
      else
        acc = acc.add(p);
    }
  }
  // Zeroify references
  for (i = 0; i < len; i++)
    wnd[i] = null;

  if (jacobianResult)
    return acc;
  else
    return acc.toP();
};

function BasePoint(curve, type) {
  this.curve = curve;
  this.type = type;
  this.precomputed = null;
}
BaseCurve.BasePoint = BasePoint;

BasePoint.prototype.eq = function eq(/*other*/) {
  throw new Error('Not implemented');
};

BasePoint.prototype.validate = function validate() {
  return this.curve.validate(this);
};

BaseCurve.prototype.decodePoint = function decodePoint(bytes, enc) {
  bytes = utils_1$1.toArray(bytes, enc);

  var len = this.p.byteLength();

  // uncompressed, hybrid-odd, hybrid-even
  if ((bytes[0] === 0x04 || bytes[0] === 0x06 || bytes[0] === 0x07) &&
      bytes.length - 1 === 2 * len) {
    if (bytes[0] === 0x06)
      assert$1(bytes[bytes.length - 1] % 2 === 0);
    else if (bytes[0] === 0x07)
      assert$1(bytes[bytes.length - 1] % 2 === 1);

    var res =  this.point(bytes.slice(1, 1 + len),
      bytes.slice(1 + len, 1 + 2 * len));

    return res;
  } else if ((bytes[0] === 0x02 || bytes[0] === 0x03) &&
              bytes.length - 1 === len) {
    return this.pointFromX(bytes.slice(1, 1 + len), bytes[0] === 0x03);
  }
  throw new Error('Unknown point format');
};

BasePoint.prototype.encodeCompressed = function encodeCompressed(enc) {
  return this.encode(enc, true);
};

BasePoint.prototype._encode = function _encode(compact) {
  var len = this.curve.p.byteLength();
  var x = this.getX().toArray('be', len);

  if (compact)
    return [ this.getY().isEven() ? 0x02 : 0x03 ].concat(x);

  return [ 0x04 ].concat(x, this.getY().toArray('be', len));
};

BasePoint.prototype.encode = function encode(enc, compact) {
  return utils_1$1.encode(this._encode(compact), enc);
};

BasePoint.prototype.precompute = function precompute(power) {
  if (this.precomputed)
    return this;

  var precomputed = {
    doubles: null,
    naf: null,
    beta: null,
  };
  precomputed.naf = this._getNAFPoints(8);
  precomputed.doubles = this._getDoubles(4, power);
  precomputed.beta = this._getBeta();
  this.precomputed = precomputed;

  return this;
};

BasePoint.prototype._hasDoubles = function _hasDoubles(k) {
  if (!this.precomputed)
    return false;

  var doubles = this.precomputed.doubles;
  if (!doubles)
    return false;

  return doubles.points.length >= Math.ceil((k.bitLength() + 1) / doubles.step);
};

BasePoint.prototype._getDoubles = function _getDoubles(step, power) {
  if (this.precomputed && this.precomputed.doubles)
    return this.precomputed.doubles;

  var doubles = [ this ];
  var acc = this;
  for (var i = 0; i < power; i += step) {
    for (var j = 0; j < step; j++)
      acc = acc.dbl();
    doubles.push(acc);
  }
  return {
    step: step,
    points: doubles,
  };
};

BasePoint.prototype._getNAFPoints = function _getNAFPoints(wnd) {
  if (this.precomputed && this.precomputed.naf)
    return this.precomputed.naf;

  var res = [ this ];
  var max = (1 << wnd) - 1;
  var dbl = max === 1 ? null : this.dbl();
  for (var i = 1; i < max; i++)
    res[i] = res[i - 1].add(dbl);
  return {
    wnd: wnd,
    points: res,
  };
};

BasePoint.prototype._getBeta = function _getBeta() {
  return null;
};

BasePoint.prototype.dblp = function dblp(k) {
  var r = this;
  for (var i = 0; i < k; i++)
    r = r.dbl();
  return r;
};

var inherits_browser = createCommonjsModule(function (module) {
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function () {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    }
  };
}
});

'use strict';






var assert$2 = utils_1$1.assert;

function ShortCurve(conf) {
  base.call(this, 'short', conf);

  this.a = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(conf.a, 16).toRed(this.red);
  this.b = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(conf.b, 16).toRed(this.red);
  this.tinv = this.two.redInvm();

  this.zeroA = this.a.fromRed().cmpn(0) === 0;
  this.threeA = this.a.fromRed().sub(this.p).cmpn(-3) === 0;

  // If the curve is endomorphic, precalculate beta and lambda
  this.endo = this._getEndomorphism(conf);
  this._endoWnafT1 = new Array(4);
  this._endoWnafT2 = new Array(4);
}
inherits_browser(ShortCurve, base);
var short_1 = ShortCurve;

ShortCurve.prototype._getEndomorphism = function _getEndomorphism(conf) {
  // No efficient endomorphism
  if (!this.zeroA || !this.g || !this.n || this.p.modn(3) !== 1)
    return;

  // Compute beta and lambda, that lambda * P = (beta * Px; Py)
  var beta;
  var lambda;
  if (conf.beta) {
    beta = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(conf.beta, 16).toRed(this.red);
  } else {
    var betas = this._getEndoRoots(this.p);
    // Choose the smallest beta
    beta = betas[0].cmp(betas[1]) < 0 ? betas[0] : betas[1];
    beta = beta.toRed(this.red);
  }
  if (conf.lambda) {
    lambda = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(conf.lambda, 16);
  } else {
    // Choose the lambda that is matching selected beta
    var lambdas = this._getEndoRoots(this.n);
    if (this.g.mul(lambdas[0]).x.cmp(this.g.x.redMul(beta)) === 0) {
      lambda = lambdas[0];
    } else {
      lambda = lambdas[1];
      assert$2(this.g.mul(lambda).x.cmp(this.g.x.redMul(beta)) === 0);
    }
  }

  // Get basis vectors, used for balanced length-two representation
  var basis;
  if (conf.basis) {
    basis = conf.basis.map(function(vec) {
      return {
        a: new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(vec.a, 16),
        b: new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(vec.b, 16),
      };
    });
  } else {
    basis = this._getEndoBasis(lambda);
  }

  return {
    beta: beta,
    lambda: lambda,
    basis: basis,
  };
};

ShortCurve.prototype._getEndoRoots = function _getEndoRoots(num) {
  // Find roots of for x^2 + x + 1 in F
  // Root = (-1 +- Sqrt(-3)) / 2
  //
  var red = num === this.p ? this.red : bn_js__WEBPACK_IMPORTED_MODULE_0___default().mont(num);
  var tinv = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(2).toRed(red).redInvm();
  var ntinv = tinv.redNeg();

  var s = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(3).toRed(red).redNeg().redSqrt().redMul(tinv);

  var l1 = ntinv.redAdd(s).fromRed();
  var l2 = ntinv.redSub(s).fromRed();
  return [ l1, l2 ];
};

ShortCurve.prototype._getEndoBasis = function _getEndoBasis(lambda) {
  // aprxSqrt >= sqrt(this.n)
  var aprxSqrt = this.n.ushrn(Math.floor(this.n.bitLength() / 2));

  // 3.74
  // Run EGCD, until r(L + 1) < aprxSqrt
  var u = lambda;
  var v = this.n.clone();
  var x1 = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(1);
  var y1 = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(0);
  var x2 = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(0);
  var y2 = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(1);

  // NOTE: all vectors are roots of: a + b * lambda = 0 (mod n)
  var a0;
  var b0;
  // First vector
  var a1;
  var b1;
  // Second vector
  var a2;
  var b2;

  var prevR;
  var i = 0;
  var r;
  var x;
  while (u.cmpn(0) !== 0) {
    var q = v.div(u);
    r = v.sub(q.mul(u));
    x = x2.sub(q.mul(x1));
    var y = y2.sub(q.mul(y1));

    if (!a1 && r.cmp(aprxSqrt) < 0) {
      a0 = prevR.neg();
      b0 = x1;
      a1 = r.neg();
      b1 = x;
    } else if (a1 && ++i === 2) {
      break;
    }
    prevR = r;

    v = u;
    u = r;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
  }
  a2 = r.neg();
  b2 = x;

  var len1 = a1.sqr().add(b1.sqr());
  var len2 = a2.sqr().add(b2.sqr());
  if (len2.cmp(len1) >= 0) {
    a2 = a0;
    b2 = b0;
  }

  // Normalize signs
  if (a1.negative) {
    a1 = a1.neg();
    b1 = b1.neg();
  }
  if (a2.negative) {
    a2 = a2.neg();
    b2 = b2.neg();
  }

  return [
    { a: a1, b: b1 },
    { a: a2, b: b2 },
  ];
};

ShortCurve.prototype._endoSplit = function _endoSplit(k) {
  var basis = this.endo.basis;
  var v1 = basis[0];
  var v2 = basis[1];

  var c1 = v2.b.mul(k).divRound(this.n);
  var c2 = v1.b.neg().mul(k).divRound(this.n);

  var p1 = c1.mul(v1.a);
  var p2 = c2.mul(v2.a);
  var q1 = c1.mul(v1.b);
  var q2 = c2.mul(v2.b);

  // Calculate answer
  var k1 = k.sub(p1).sub(p2);
  var k2 = q1.add(q2).neg();
  return { k1: k1, k2: k2 };
};

ShortCurve.prototype.pointFromX = function pointFromX(x, odd) {
  x = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(x, 16);
  if (!x.red)
    x = x.toRed(this.red);

  var y2 = x.redSqr().redMul(x).redIAdd(x.redMul(this.a)).redIAdd(this.b);
  var y = y2.redSqrt();
  if (y.redSqr().redSub(y2).cmp(this.zero) !== 0)
    throw new Error('invalid point');

  // XXX Is there any way to tell if the number is odd without converting it
  // to non-red form?
  var isOdd = y.fromRed().isOdd();
  if (odd && !isOdd || !odd && isOdd)
    y = y.redNeg();

  return this.point(x, y);
};

ShortCurve.prototype.validate = function validate(point) {
  if (point.inf)
    return true;

  var x = point.x;
  var y = point.y;

  var ax = this.a.redMul(x);
  var rhs = x.redSqr().redMul(x).redIAdd(ax).redIAdd(this.b);
  return y.redSqr().redISub(rhs).cmpn(0) === 0;
};

ShortCurve.prototype._endoWnafMulAdd =
    function _endoWnafMulAdd(points, coeffs, jacobianResult) {
      var npoints = this._endoWnafT1;
      var ncoeffs = this._endoWnafT2;
      for (var i = 0; i < points.length; i++) {
        var split = this._endoSplit(coeffs[i]);
        var p = points[i];
        var beta = p._getBeta();

        if (split.k1.negative) {
          split.k1.ineg();
          p = p.neg(true);
        }
        if (split.k2.negative) {
          split.k2.ineg();
          beta = beta.neg(true);
        }

        npoints[i * 2] = p;
        npoints[i * 2 + 1] = beta;
        ncoeffs[i * 2] = split.k1;
        ncoeffs[i * 2 + 1] = split.k2;
      }
      var res = this._wnafMulAdd(1, npoints, ncoeffs, i * 2, jacobianResult);

      // Clean-up references to points and coefficients
      for (var j = 0; j < i * 2; j++) {
        npoints[j] = null;
        ncoeffs[j] = null;
      }
      return res;
    };

function Point(curve, x, y, isRed) {
  base.BasePoint.call(this, curve, 'affine');
  if (x === null && y === null) {
    this.x = null;
    this.y = null;
    this.inf = true;
  } else {
    this.x = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(x, 16);
    this.y = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(y, 16);
    // Force redgomery representation when loading from JSON
    if (isRed) {
      this.x.forceRed(this.curve.red);
      this.y.forceRed(this.curve.red);
    }
    if (!this.x.red)
      this.x = this.x.toRed(this.curve.red);
    if (!this.y.red)
      this.y = this.y.toRed(this.curve.red);
    this.inf = false;
  }
}
inherits_browser(Point, base.BasePoint);

ShortCurve.prototype.point = function point(x, y, isRed) {
  return new Point(this, x, y, isRed);
};

ShortCurve.prototype.pointFromJSON = function pointFromJSON(obj, red) {
  return Point.fromJSON(this, obj, red);
};

Point.prototype._getBeta = function _getBeta() {
  if (!this.curve.endo)
    return;

  var pre = this.precomputed;
  if (pre && pre.beta)
    return pre.beta;

  var beta = this.curve.point(this.x.redMul(this.curve.endo.beta), this.y);
  if (pre) {
    var curve = this.curve;
    var endoMul = function(p) {
      return curve.point(p.x.redMul(curve.endo.beta), p.y);
    };
    pre.beta = beta;
    beta.precomputed = {
      beta: null,
      naf: pre.naf && {
        wnd: pre.naf.wnd,
        points: pre.naf.points.map(endoMul),
      },
      doubles: pre.doubles && {
        step: pre.doubles.step,
        points: pre.doubles.points.map(endoMul),
      },
    };
  }
  return beta;
};

Point.prototype.toJSON = function toJSON() {
  if (!this.precomputed)
    return [ this.x, this.y ];

  return [ this.x, this.y, this.precomputed && {
    doubles: this.precomputed.doubles && {
      step: this.precomputed.doubles.step,
      points: this.precomputed.doubles.points.slice(1),
    },
    naf: this.precomputed.naf && {
      wnd: this.precomputed.naf.wnd,
      points: this.precomputed.naf.points.slice(1),
    },
  } ];
};

Point.fromJSON = function fromJSON(curve, obj, red) {
  if (typeof obj === 'string')
    obj = JSON.parse(obj);
  var res = curve.point(obj[0], obj[1], red);
  if (!obj[2])
    return res;

  function obj2point(obj) {
    return curve.point(obj[0], obj[1], red);
  }

  var pre = obj[2];
  res.precomputed = {
    beta: null,
    doubles: pre.doubles && {
      step: pre.doubles.step,
      points: [ res ].concat(pre.doubles.points.map(obj2point)),
    },
    naf: pre.naf && {
      wnd: pre.naf.wnd,
      points: [ res ].concat(pre.naf.points.map(obj2point)),
    },
  };
  return res;
};

Point.prototype.inspect = function inspect() {
  if (this.isInfinity())
    return '<EC Point Infinity>';
  return '<EC Point x: ' + this.x.fromRed().toString(16, 2) +
      ' y: ' + this.y.fromRed().toString(16, 2) + '>';
};

Point.prototype.isInfinity = function isInfinity() {
  return this.inf;
};

Point.prototype.add = function add(p) {
  // O + P = P
  if (this.inf)
    return p;

  // P + O = P
  if (p.inf)
    return this;

  // P + P = 2P
  if (this.eq(p))
    return this.dbl();

  // P + (-P) = O
  if (this.neg().eq(p))
    return this.curve.point(null, null);

  // P + Q = O
  if (this.x.cmp(p.x) === 0)
    return this.curve.point(null, null);

  var c = this.y.redSub(p.y);
  if (c.cmpn(0) !== 0)
    c = c.redMul(this.x.redSub(p.x).redInvm());
  var nx = c.redSqr().redISub(this.x).redISub(p.x);
  var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
  return this.curve.point(nx, ny);
};

Point.prototype.dbl = function dbl() {
  if (this.inf)
    return this;

  // 2P = O
  var ys1 = this.y.redAdd(this.y);
  if (ys1.cmpn(0) === 0)
    return this.curve.point(null, null);

  var a = this.curve.a;

  var x2 = this.x.redSqr();
  var dyinv = ys1.redInvm();
  var c = x2.redAdd(x2).redIAdd(x2).redIAdd(a).redMul(dyinv);

  var nx = c.redSqr().redISub(this.x.redAdd(this.x));
  var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
  return this.curve.point(nx, ny);
};

Point.prototype.getX = function getX() {
  return this.x.fromRed();
};

Point.prototype.getY = function getY() {
  return this.y.fromRed();
};

Point.prototype.mul = function mul(k) {
  k = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(k, 16);
  if (this.isInfinity())
    return this;
  else if (this._hasDoubles(k))
    return this.curve._fixedNafMul(this, k);
  else if (this.curve.endo)
    return this.curve._endoWnafMulAdd([ this ], [ k ]);
  else
    return this.curve._wnafMul(this, k);
};

Point.prototype.mulAdd = function mulAdd(k1, p2, k2) {
  var points = [ this, p2 ];
  var coeffs = [ k1, k2 ];
  if (this.curve.endo)
    return this.curve._endoWnafMulAdd(points, coeffs);
  else
    return this.curve._wnafMulAdd(1, points, coeffs, 2);
};

Point.prototype.jmulAdd = function jmulAdd(k1, p2, k2) {
  var points = [ this, p2 ];
  var coeffs = [ k1, k2 ];
  if (this.curve.endo)
    return this.curve._endoWnafMulAdd(points, coeffs, true);
  else
    return this.curve._wnafMulAdd(1, points, coeffs, 2, true);
};

Point.prototype.eq = function eq(p) {
  return this === p ||
         this.inf === p.inf &&
             (this.inf || this.x.cmp(p.x) === 0 && this.y.cmp(p.y) === 0);
};

Point.prototype.neg = function neg(_precompute) {
  if (this.inf)
    return this;

  var res = this.curve.point(this.x, this.y.redNeg());
  if (_precompute && this.precomputed) {
    var pre = this.precomputed;
    var negate = function(p) {
      return p.neg();
    };
    res.precomputed = {
      naf: pre.naf && {
        wnd: pre.naf.wnd,
        points: pre.naf.points.map(negate),
      },
      doubles: pre.doubles && {
        step: pre.doubles.step,
        points: pre.doubles.points.map(negate),
      },
    };
  }
  return res;
};

Point.prototype.toJ = function toJ() {
  if (this.inf)
    return this.curve.jpoint(null, null, null);

  var res = this.curve.jpoint(this.x, this.y, this.curve.one);
  return res;
};

function JPoint(curve, x, y, z) {
  base.BasePoint.call(this, curve, 'jacobian');
  if (x === null && y === null && z === null) {
    this.x = this.curve.one;
    this.y = this.curve.one;
    this.z = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(0);
  } else {
    this.x = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(x, 16);
    this.y = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(y, 16);
    this.z = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(z, 16);
  }
  if (!this.x.red)
    this.x = this.x.toRed(this.curve.red);
  if (!this.y.red)
    this.y = this.y.toRed(this.curve.red);
  if (!this.z.red)
    this.z = this.z.toRed(this.curve.red);

  this.zOne = this.z === this.curve.one;
}
inherits_browser(JPoint, base.BasePoint);

ShortCurve.prototype.jpoint = function jpoint(x, y, z) {
  return new JPoint(this, x, y, z);
};

JPoint.prototype.toP = function toP() {
  if (this.isInfinity())
    return this.curve.point(null, null);

  var zinv = this.z.redInvm();
  var zinv2 = zinv.redSqr();
  var ax = this.x.redMul(zinv2);
  var ay = this.y.redMul(zinv2).redMul(zinv);

  return this.curve.point(ax, ay);
};

JPoint.prototype.neg = function neg() {
  return this.curve.jpoint(this.x, this.y.redNeg(), this.z);
};

JPoint.prototype.add = function add(p) {
  // O + P = P
  if (this.isInfinity())
    return p;

  // P + O = P
  if (p.isInfinity())
    return this;

  // 12M + 4S + 7A
  var pz2 = p.z.redSqr();
  var z2 = this.z.redSqr();
  var u1 = this.x.redMul(pz2);
  var u2 = p.x.redMul(z2);
  var s1 = this.y.redMul(pz2.redMul(p.z));
  var s2 = p.y.redMul(z2.redMul(this.z));

  var h = u1.redSub(u2);
  var r = s1.redSub(s2);
  if (h.cmpn(0) === 0) {
    if (r.cmpn(0) !== 0)
      return this.curve.jpoint(null, null, null);
    else
      return this.dbl();
  }

  var h2 = h.redSqr();
  var h3 = h2.redMul(h);
  var v = u1.redMul(h2);

  var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
  var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
  var nz = this.z.redMul(p.z).redMul(h);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.mixedAdd = function mixedAdd(p) {
  // O + P = P
  if (this.isInfinity())
    return p.toJ();

  // P + O = P
  if (p.isInfinity())
    return this;

  // 8M + 3S + 7A
  var z2 = this.z.redSqr();
  var u1 = this.x;
  var u2 = p.x.redMul(z2);
  var s1 = this.y;
  var s2 = p.y.redMul(z2).redMul(this.z);

  var h = u1.redSub(u2);
  var r = s1.redSub(s2);
  if (h.cmpn(0) === 0) {
    if (r.cmpn(0) !== 0)
      return this.curve.jpoint(null, null, null);
    else
      return this.dbl();
  }

  var h2 = h.redSqr();
  var h3 = h2.redMul(h);
  var v = u1.redMul(h2);

  var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
  var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
  var nz = this.z.redMul(h);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.dblp = function dblp(pow) {
  if (pow === 0)
    return this;
  if (this.isInfinity())
    return this;
  if (!pow)
    return this.dbl();

  var i;
  if (this.curve.zeroA || this.curve.threeA) {
    var r = this;
    for (i = 0; i < pow; i++)
      r = r.dbl();
    return r;
  }

  // 1M + 2S + 1A + N * (4S + 5M + 8A)
  // N = 1 => 6M + 6S + 9A
  var a = this.curve.a;
  var tinv = this.curve.tinv;

  var jx = this.x;
  var jy = this.y;
  var jz = this.z;
  var jz4 = jz.redSqr().redSqr();

  // Reuse results
  var jyd = jy.redAdd(jy);
  for (i = 0; i < pow; i++) {
    var jx2 = jx.redSqr();
    var jyd2 = jyd.redSqr();
    var jyd4 = jyd2.redSqr();
    var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));

    var t1 = jx.redMul(jyd2);
    var nx = c.redSqr().redISub(t1.redAdd(t1));
    var t2 = t1.redISub(nx);
    var dny = c.redMul(t2);
    dny = dny.redIAdd(dny).redISub(jyd4);
    var nz = jyd.redMul(jz);
    if (i + 1 < pow)
      jz4 = jz4.redMul(jyd4);

    jx = nx;
    jz = nz;
    jyd = dny;
  }

  return this.curve.jpoint(jx, jyd.redMul(tinv), jz);
};

JPoint.prototype.dbl = function dbl() {
  if (this.isInfinity())
    return this;

  if (this.curve.zeroA)
    return this._zeroDbl();
  else if (this.curve.threeA)
    return this._threeDbl();
  else
    return this._dbl();
};

JPoint.prototype._zeroDbl = function _zeroDbl() {
  var nx;
  var ny;
  var nz;
  // Z = 1
  if (this.zOne) {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html
    //     #doubling-mdbl-2007-bl
    // 1M + 5S + 14A

    // XX = X1^2
    var xx = this.x.redSqr();
    // YY = Y1^2
    var yy = this.y.redSqr();
    // YYYY = YY^2
    var yyyy = yy.redSqr();
    // S = 2 * ((X1 + YY)^2 - XX - YYYY)
    var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
    s = s.redIAdd(s);
    // M = 3 * XX + a; a = 0
    var m = xx.redAdd(xx).redIAdd(xx);
    // T = M ^ 2 - 2*S
    var t = m.redSqr().redISub(s).redISub(s);

    // 8 * YYYY
    var yyyy8 = yyyy.redIAdd(yyyy);
    yyyy8 = yyyy8.redIAdd(yyyy8);
    yyyy8 = yyyy8.redIAdd(yyyy8);

    // X3 = T
    nx = t;
    // Y3 = M * (S - T) - 8 * YYYY
    ny = m.redMul(s.redISub(t)).redISub(yyyy8);
    // Z3 = 2*Y1
    nz = this.y.redAdd(this.y);
  } else {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html
    //     #doubling-dbl-2009-l
    // 2M + 5S + 13A

    // A = X1^2
    var a = this.x.redSqr();
    // B = Y1^2
    var b = this.y.redSqr();
    // C = B^2
    var c = b.redSqr();
    // D = 2 * ((X1 + B)^2 - A - C)
    var d = this.x.redAdd(b).redSqr().redISub(a).redISub(c);
    d = d.redIAdd(d);
    // E = 3 * A
    var e = a.redAdd(a).redIAdd(a);
    // F = E^2
    var f = e.redSqr();

    // 8 * C
    var c8 = c.redIAdd(c);
    c8 = c8.redIAdd(c8);
    c8 = c8.redIAdd(c8);

    // X3 = F - 2 * D
    nx = f.redISub(d).redISub(d);
    // Y3 = E * (D - X3) - 8 * C
    ny = e.redMul(d.redISub(nx)).redISub(c8);
    // Z3 = 2 * Y1 * Z1
    nz = this.y.redMul(this.z);
    nz = nz.redIAdd(nz);
  }

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype._threeDbl = function _threeDbl() {
  var nx;
  var ny;
  var nz;
  // Z = 1
  if (this.zOne) {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html
    //     #doubling-mdbl-2007-bl
    // 1M + 5S + 15A

    // XX = X1^2
    var xx = this.x.redSqr();
    // YY = Y1^2
    var yy = this.y.redSqr();
    // YYYY = YY^2
    var yyyy = yy.redSqr();
    // S = 2 * ((X1 + YY)^2 - XX - YYYY)
    var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
    s = s.redIAdd(s);
    // M = 3 * XX + a
    var m = xx.redAdd(xx).redIAdd(xx).redIAdd(this.curve.a);
    // T = M^2 - 2 * S
    var t = m.redSqr().redISub(s).redISub(s);
    // X3 = T
    nx = t;
    // Y3 = M * (S - T) - 8 * YYYY
    var yyyy8 = yyyy.redIAdd(yyyy);
    yyyy8 = yyyy8.redIAdd(yyyy8);
    yyyy8 = yyyy8.redIAdd(yyyy8);
    ny = m.redMul(s.redISub(t)).redISub(yyyy8);
    // Z3 = 2 * Y1
    nz = this.y.redAdd(this.y);
  } else {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html#doubling-dbl-2001-b
    // 3M + 5S

    // delta = Z1^2
    var delta = this.z.redSqr();
    // gamma = Y1^2
    var gamma = this.y.redSqr();
    // beta = X1 * gamma
    var beta = this.x.redMul(gamma);
    // alpha = 3 * (X1 - delta) * (X1 + delta)
    var alpha = this.x.redSub(delta).redMul(this.x.redAdd(delta));
    alpha = alpha.redAdd(alpha).redIAdd(alpha);
    // X3 = alpha^2 - 8 * beta
    var beta4 = beta.redIAdd(beta);
    beta4 = beta4.redIAdd(beta4);
    var beta8 = beta4.redAdd(beta4);
    nx = alpha.redSqr().redISub(beta8);
    // Z3 = (Y1 + Z1)^2 - gamma - delta
    nz = this.y.redAdd(this.z).redSqr().redISub(gamma).redISub(delta);
    // Y3 = alpha * (4 * beta - X3) - 8 * gamma^2
    var ggamma8 = gamma.redSqr();
    ggamma8 = ggamma8.redIAdd(ggamma8);
    ggamma8 = ggamma8.redIAdd(ggamma8);
    ggamma8 = ggamma8.redIAdd(ggamma8);
    ny = alpha.redMul(beta4.redISub(nx)).redISub(ggamma8);
  }

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype._dbl = function _dbl() {
  var a = this.curve.a;

  // 4M + 6S + 10A
  var jx = this.x;
  var jy = this.y;
  var jz = this.z;
  var jz4 = jz.redSqr().redSqr();

  var jx2 = jx.redSqr();
  var jy2 = jy.redSqr();

  var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));

  var jxd4 = jx.redAdd(jx);
  jxd4 = jxd4.redIAdd(jxd4);
  var t1 = jxd4.redMul(jy2);
  var nx = c.redSqr().redISub(t1.redAdd(t1));
  var t2 = t1.redISub(nx);

  var jyd8 = jy2.redSqr();
  jyd8 = jyd8.redIAdd(jyd8);
  jyd8 = jyd8.redIAdd(jyd8);
  jyd8 = jyd8.redIAdd(jyd8);
  var ny = c.redMul(t2).redISub(jyd8);
  var nz = jy.redAdd(jy).redMul(jz);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.trpl = function trpl() {
  if (!this.curve.zeroA)
    return this.dbl().add(this);

  // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#tripling-tpl-2007-bl
  // 5M + 10S + ...

  // XX = X1^2
  var xx = this.x.redSqr();
  // YY = Y1^2
  var yy = this.y.redSqr();
  // ZZ = Z1^2
  var zz = this.z.redSqr();
  // YYYY = YY^2
  var yyyy = yy.redSqr();
  // M = 3 * XX + a * ZZ2; a = 0
  var m = xx.redAdd(xx).redIAdd(xx);
  // MM = M^2
  var mm = m.redSqr();
  // E = 6 * ((X1 + YY)^2 - XX - YYYY) - MM
  var e = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
  e = e.redIAdd(e);
  e = e.redAdd(e).redIAdd(e);
  e = e.redISub(mm);
  // EE = E^2
  var ee = e.redSqr();
  // T = 16*YYYY
  var t = yyyy.redIAdd(yyyy);
  t = t.redIAdd(t);
  t = t.redIAdd(t);
  t = t.redIAdd(t);
  // U = (M + E)^2 - MM - EE - T
  var u = m.redIAdd(e).redSqr().redISub(mm).redISub(ee).redISub(t);
  // X3 = 4 * (X1 * EE - 4 * YY * U)
  var yyu4 = yy.redMul(u);
  yyu4 = yyu4.redIAdd(yyu4);
  yyu4 = yyu4.redIAdd(yyu4);
  var nx = this.x.redMul(ee).redISub(yyu4);
  nx = nx.redIAdd(nx);
  nx = nx.redIAdd(nx);
  // Y3 = 8 * Y1 * (U * (T - U) - E * EE)
  var ny = this.y.redMul(u.redMul(t.redISub(u)).redISub(e.redMul(ee)));
  ny = ny.redIAdd(ny);
  ny = ny.redIAdd(ny);
  ny = ny.redIAdd(ny);
  // Z3 = (Z1 + E)^2 - ZZ - EE
  var nz = this.z.redAdd(e).redSqr().redISub(zz).redISub(ee);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.mul = function mul(k, kbase) {
  k = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(k, kbase);

  return this.curve._wnafMul(this, k);
};

JPoint.prototype.eq = function eq(p) {
  if (p.type === 'affine')
    return this.eq(p.toJ());

  if (this === p)
    return true;

  // x1 * z2^2 == x2 * z1^2
  var z2 = this.z.redSqr();
  var pz2 = p.z.redSqr();
  if (this.x.redMul(pz2).redISub(p.x.redMul(z2)).cmpn(0) !== 0)
    return false;

  // y1 * z2^3 == y2 * z1^3
  var z3 = z2.redMul(this.z);
  var pz3 = pz2.redMul(p.z);
  return this.y.redMul(pz3).redISub(p.y.redMul(z3)).cmpn(0) === 0;
};

JPoint.prototype.eqXToP = function eqXToP(x) {
  var zs = this.z.redSqr();
  var rx = x.toRed(this.curve.red).redMul(zs);
  if (this.x.cmp(rx) === 0)
    return true;

  var xc = x.clone();
  var t = this.curve.redN.redMul(zs);
  for (;;) {
    xc.iadd(this.curve.n);
    if (xc.cmp(this.curve.p) >= 0)
      return false;

    rx.redIAdd(t);
    if (this.x.cmp(rx) === 0)
      return true;
  }
};

JPoint.prototype.inspect = function inspect() {
  if (this.isInfinity())
    return '<EC JPoint Infinity>';
  return '<EC JPoint x: ' + this.x.toString(16, 2) +
      ' y: ' + this.y.toString(16, 2) +
      ' z: ' + this.z.toString(16, 2) + '>';
};

JPoint.prototype.isInfinity = function isInfinity() {
  // XXX This code assumes that zero is always zero in red
  return this.z.cmpn(0) === 0;
};

var curve_1 = createCommonjsModule(function (module, exports) {
'use strict';

var curve = exports;

curve.base = base;
curve.short = short_1;
curve.mont = /*RicMoo:ethers:require(./mont)*/(null);
curve.edwards = /*RicMoo:ethers:require(./edwards)*/(null);
});

var curves_1 = createCommonjsModule(function (module, exports) {
'use strict';

var curves = exports;





var assert = utils_1$1.assert;

function PresetCurve(options) {
  if (options.type === 'short')
    this.curve = new curve_1.short(options);
  else if (options.type === 'edwards')
    this.curve = new curve_1.edwards(options);
  else
    this.curve = new curve_1.mont(options);
  this.g = this.curve.g;
  this.n = this.curve.n;
  this.hash = options.hash;

  assert(this.g.validate(), 'Invalid curve');
  assert(this.g.mul(this.n).isInfinity(), 'Invalid curve, G*N != O');
}
curves.PresetCurve = PresetCurve;

function defineCurve(name, options) {
  Object.defineProperty(curves, name, {
    configurable: true,
    enumerable: true,
    get: function() {
      var curve = new PresetCurve(options);
      Object.defineProperty(curves, name, {
        configurable: true,
        enumerable: true,
        value: curve,
      });
      return curve;
    },
  });
}

defineCurve('p192', {
  type: 'short',
  prime: 'p192',
  p: 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff',
  a: 'ffffffff ffffffff ffffffff fffffffe ffffffff fffffffc',
  b: '64210519 e59c80e7 0fa7e9ab 72243049 feb8deec c146b9b1',
  n: 'ffffffff ffffffff ffffffff 99def836 146bc9b1 b4d22831',
  hash: (hash_js__WEBPACK_IMPORTED_MODULE_1___default().sha256),
  gRed: false,
  g: [
    '188da80e b03090f6 7cbf20eb 43a18800 f4ff0afd 82ff1012',
    '07192b95 ffc8da78 631011ed 6b24cdd5 73f977a1 1e794811',
  ],
});

defineCurve('p224', {
  type: 'short',
  prime: 'p224',
  p: 'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001',
  a: 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff fffffffe',
  b: 'b4050a85 0c04b3ab f5413256 5044b0b7 d7bfd8ba 270b3943 2355ffb4',
  n: 'ffffffff ffffffff ffffffff ffff16a2 e0b8f03e 13dd2945 5c5c2a3d',
  hash: (hash_js__WEBPACK_IMPORTED_MODULE_1___default().sha256),
  gRed: false,
  g: [
    'b70e0cbd 6bb4bf7f 321390b9 4a03c1d3 56c21122 343280d6 115c1d21',
    'bd376388 b5f723fb 4c22dfe6 cd4375a0 5a074764 44d58199 85007e34',
  ],
});

defineCurve('p256', {
  type: 'short',
  prime: null,
  p: 'ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff ffffffff',
  a: 'ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff fffffffc',
  b: '5ac635d8 aa3a93e7 b3ebbd55 769886bc 651d06b0 cc53b0f6 3bce3c3e 27d2604b',
  n: 'ffffffff 00000000 ffffffff ffffffff bce6faad a7179e84 f3b9cac2 fc632551',
  hash: (hash_js__WEBPACK_IMPORTED_MODULE_1___default().sha256),
  gRed: false,
  g: [
    '6b17d1f2 e12c4247 f8bce6e5 63a440f2 77037d81 2deb33a0 f4a13945 d898c296',
    '4fe342e2 fe1a7f9b 8ee7eb4a 7c0f9e16 2bce3357 6b315ece cbb64068 37bf51f5',
  ],
});

defineCurve('p384', {
  type: 'short',
  prime: null,
  p: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'fffffffe ffffffff 00000000 00000000 ffffffff',
  a: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'fffffffe ffffffff 00000000 00000000 fffffffc',
  b: 'b3312fa7 e23ee7e4 988e056b e3f82d19 181d9c6e fe814112 0314088f ' +
     '5013875a c656398d 8a2ed19d 2a85c8ed d3ec2aef',
  n: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff c7634d81 ' +
     'f4372ddf 581a0db2 48b0a77a ecec196a ccc52973',
  hash: (hash_js__WEBPACK_IMPORTED_MODULE_1___default().sha384),
  gRed: false,
  g: [
    'aa87ca22 be8b0537 8eb1c71e f320ad74 6e1d3b62 8ba79b98 59f741e0 82542a38 ' +
    '5502f25d bf55296c 3a545e38 72760ab7',
    '3617de4a 96262c6f 5d9e98bf 9292dc29 f8f41dbd 289a147c e9da3113 b5f0b8c0 ' +
    '0a60b1ce 1d7e819d 7a431d7c 90ea0e5f',
  ],
});

defineCurve('p521', {
  type: 'short',
  prime: null,
  p: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'ffffffff ffffffff ffffffff ffffffff ffffffff',
  a: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'ffffffff ffffffff ffffffff ffffffff fffffffc',
  b: '00000051 953eb961 8e1c9a1f 929a21a0 b68540ee a2da725b ' +
     '99b315f3 b8b48991 8ef109e1 56193951 ec7e937b 1652c0bd ' +
     '3bb1bf07 3573df88 3d2c34f1 ef451fd4 6b503f00',
  n: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'ffffffff ffffffff fffffffa 51868783 bf2f966b 7fcc0148 ' +
     'f709a5d0 3bb5c9b8 899c47ae bb6fb71e 91386409',
  hash: (hash_js__WEBPACK_IMPORTED_MODULE_1___default().sha512),
  gRed: false,
  g: [
    '000000c6 858e06b7 0404e9cd 9e3ecb66 2395b442 9c648139 ' +
    '053fb521 f828af60 6b4d3dba a14b5e77 efe75928 fe1dc127 ' +
    'a2ffa8de 3348b3c1 856a429b f97e7e31 c2e5bd66',
    '00000118 39296a78 9a3bc004 5c8a5fb4 2c7d1bd9 98f54449 ' +
    '579b4468 17afbd17 273e662c 97ee7299 5ef42640 c550b901 ' +
    '3fad0761 353c7086 a272c240 88be9476 9fd16650',
  ],
});

defineCurve('curve25519', {
  type: 'mont',
  prime: 'p25519',
  p: '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed',
  a: '76d06',
  b: '1',
  n: '1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed',
  hash: (hash_js__WEBPACK_IMPORTED_MODULE_1___default().sha256),
  gRed: false,
  g: [
    '9',
  ],
});

defineCurve('ed25519', {
  type: 'edwards',
  prime: 'p25519',
  p: '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed',
  a: '-1',
  c: '1',
  // -121665 * (121666^(-1)) (mod P)
  d: '52036cee2b6ffe73 8cc740797779e898 00700a4d4141d8ab 75eb4dca135978a3',
  n: '1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed',
  hash: (hash_js__WEBPACK_IMPORTED_MODULE_1___default().sha256),
  gRed: false,
  g: [
    '216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a',

    // 4/5
    '6666666666666666666666666666666666666666666666666666666666666658',
  ],
});

var pre;
try {
  pre = /*RicMoo:ethers:require(./precomputed/secp256k1)*/(null).crash();
} catch (e) {
  pre = undefined;
}

defineCurve('secp256k1', {
  type: 'short',
  prime: 'k256',
  p: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f',
  a: '0',
  b: '7',
  n: 'ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141',
  h: '1',
  hash: (hash_js__WEBPACK_IMPORTED_MODULE_1___default().sha256),

  // Precomputed endomorphism
  beta: '7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee',
  lambda: '5363ad4cc05c30e0a5261c028812645a122e22ea20816678df02967c1b23bd72',
  basis: [
    {
      a: '3086d221a7d46bcde86c90e49284eb15',
      b: '-e4437ed6010e88286f547fa90abfe4c3',
    },
    {
      a: '114ca50f7a8e2f3f657c1108d9d44cfd8',
      b: '3086d221a7d46bcde86c90e49284eb15',
    },
  ],

  gRed: false,
  g: [
    '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    '483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
    pre,
  ],
});
});

'use strict';





function HmacDRBG(options) {
  if (!(this instanceof HmacDRBG))
    return new HmacDRBG(options);
  this.hash = options.hash;
  this.predResist = !!options.predResist;

  this.outLen = this.hash.outSize;
  this.minEntropy = options.minEntropy || this.hash.hmacStrength;

  this._reseed = null;
  this.reseedInterval = null;
  this.K = null;
  this.V = null;

  var entropy = utils_1.toArray(options.entropy, options.entropyEnc || 'hex');
  var nonce = utils_1.toArray(options.nonce, options.nonceEnc || 'hex');
  var pers = utils_1.toArray(options.pers, options.persEnc || 'hex');
  minimalisticAssert(entropy.length >= (this.minEntropy / 8),
         'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits');
  this._init(entropy, nonce, pers);
}
var hmacDrbg = HmacDRBG;

HmacDRBG.prototype._init = function init(entropy, nonce, pers) {
  var seed = entropy.concat(nonce).concat(pers);

  this.K = new Array(this.outLen / 8);
  this.V = new Array(this.outLen / 8);
  for (var i = 0; i < this.V.length; i++) {
    this.K[i] = 0x00;
    this.V[i] = 0x01;
  }

  this._update(seed);
  this._reseed = 1;
  this.reseedInterval = 0x1000000000000;  // 2^48
};

HmacDRBG.prototype._hmac = function hmac() {
  return new (hash_js__WEBPACK_IMPORTED_MODULE_1___default().hmac)(this.hash, this.K);
};

HmacDRBG.prototype._update = function update(seed) {
  var kmac = this._hmac()
                 .update(this.V)
                 .update([ 0x00 ]);
  if (seed)
    kmac = kmac.update(seed);
  this.K = kmac.digest();
  this.V = this._hmac().update(this.V).digest();
  if (!seed)
    return;

  this.K = this._hmac()
               .update(this.V)
               .update([ 0x01 ])
               .update(seed)
               .digest();
  this.V = this._hmac().update(this.V).digest();
};

HmacDRBG.prototype.reseed = function reseed(entropy, entropyEnc, add, addEnc) {
  // Optional entropy enc
  if (typeof entropyEnc !== 'string') {
    addEnc = add;
    add = entropyEnc;
    entropyEnc = null;
  }

  entropy = utils_1.toArray(entropy, entropyEnc);
  add = utils_1.toArray(add, addEnc);

  minimalisticAssert(entropy.length >= (this.minEntropy / 8),
         'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits');

  this._update(entropy.concat(add || []));
  this._reseed = 1;
};

HmacDRBG.prototype.generate = function generate(len, enc, add, addEnc) {
  if (this._reseed > this.reseedInterval)
    throw new Error('Reseed is required');

  // Optional encoding
  if (typeof enc !== 'string') {
    addEnc = add;
    add = enc;
    enc = null;
  }

  // Optional additional data
  if (add) {
    add = utils_1.toArray(add, addEnc || 'hex');
    this._update(add);
  }

  var temp = [];
  while (temp.length < len) {
    this.V = this._hmac().update(this.V).digest();
    temp = temp.concat(this.V);
  }

  var res = temp.slice(0, len);
  this._update(add);
  this._reseed++;
  return utils_1.encode(res, enc);
};

'use strict';



var assert$3 = utils_1$1.assert;

function KeyPair(ec, options) {
  this.ec = ec;
  this.priv = null;
  this.pub = null;

  // KeyPair(ec, { priv: ..., pub: ... })
  if (options.priv)
    this._importPrivate(options.priv, options.privEnc);
  if (options.pub)
    this._importPublic(options.pub, options.pubEnc);
}
var key = KeyPair;

KeyPair.fromPublic = function fromPublic(ec, pub, enc) {
  if (pub instanceof KeyPair)
    return pub;

  return new KeyPair(ec, {
    pub: pub,
    pubEnc: enc,
  });
};

KeyPair.fromPrivate = function fromPrivate(ec, priv, enc) {
  if (priv instanceof KeyPair)
    return priv;

  return new KeyPair(ec, {
    priv: priv,
    privEnc: enc,
  });
};

KeyPair.prototype.validate = function validate() {
  var pub = this.getPublic();

  if (pub.isInfinity())
    return { result: false, reason: 'Invalid public key' };
  if (!pub.validate())
    return { result: false, reason: 'Public key is not a point' };
  if (!pub.mul(this.ec.curve.n).isInfinity())
    return { result: false, reason: 'Public key * N != O' };

  return { result: true, reason: null };
};

KeyPair.prototype.getPublic = function getPublic(compact, enc) {
  // compact is optional argument
  if (typeof compact === 'string') {
    enc = compact;
    compact = null;
  }

  if (!this.pub)
    this.pub = this.ec.g.mul(this.priv);

  if (!enc)
    return this.pub;

  return this.pub.encode(enc, compact);
};

KeyPair.prototype.getPrivate = function getPrivate(enc) {
  if (enc === 'hex')
    return this.priv.toString(16, 2);
  else
    return this.priv;
};

KeyPair.prototype._importPrivate = function _importPrivate(key, enc) {
  this.priv = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(key, enc || 16);

  // Ensure that the priv won't be bigger than n, otherwise we may fail
  // in fixed multiplication method
  this.priv = this.priv.umod(this.ec.curve.n);
};

KeyPair.prototype._importPublic = function _importPublic(key, enc) {
  if (key.x || key.y) {
    // Montgomery points only have an `x` coordinate.
    // Weierstrass/Edwards points on the other hand have both `x` and
    // `y` coordinates.
    if (this.ec.curve.type === 'mont') {
      assert$3(key.x, 'Need x coordinate');
    } else if (this.ec.curve.type === 'short' ||
               this.ec.curve.type === 'edwards') {
      assert$3(key.x && key.y, 'Need both x and y coordinate');
    }
    this.pub = this.ec.curve.point(key.x, key.y);
    return;
  }
  this.pub = this.ec.curve.decodePoint(key, enc);
};

// ECDH
KeyPair.prototype.derive = function derive(pub) {
  if(!pub.validate()) {
    assert$3(pub.validate(), 'public point not validated');
  }
  return pub.mul(this.priv).getX();
};

// ECDSA
KeyPair.prototype.sign = function sign(msg, enc, options) {
  return this.ec.sign(msg, this, enc, options);
};

KeyPair.prototype.verify = function verify(msg, signature) {
  return this.ec.verify(msg, signature, this);
};

KeyPair.prototype.inspect = function inspect() {
  return '<Key priv: ' + (this.priv && this.priv.toString(16, 2)) +
         ' pub: ' + (this.pub && this.pub.inspect()) + ' >';
};

'use strict';




var assert$4 = utils_1$1.assert;

function Signature(options, enc) {
  if (options instanceof Signature)
    return options;

  if (this._importDER(options, enc))
    return;

  assert$4(options.r && options.s, 'Signature without r or s');
  this.r = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(options.r, 16);
  this.s = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(options.s, 16);
  if (options.recoveryParam === undefined)
    this.recoveryParam = null;
  else
    this.recoveryParam = options.recoveryParam;
}
var signature = Signature;

function Position() {
  this.place = 0;
}

function getLength(buf, p) {
  var initial = buf[p.place++];
  if (!(initial & 0x80)) {
    return initial;
  }
  var octetLen = initial & 0xf;

  // Indefinite length or overflow
  if (octetLen === 0 || octetLen > 4) {
    return false;
  }

  var val = 0;
  for (var i = 0, off = p.place; i < octetLen; i++, off++) {
    val <<= 8;
    val |= buf[off];
    val >>>= 0;
  }

  // Leading zeroes
  if (val <= 0x7f) {
    return false;
  }

  p.place = off;
  return val;
}

function rmPadding(buf) {
  var i = 0;
  var len = buf.length - 1;
  while (!buf[i] && !(buf[i + 1] & 0x80) && i < len) {
    i++;
  }
  if (i === 0) {
    return buf;
  }
  return buf.slice(i);
}

Signature.prototype._importDER = function _importDER(data, enc) {
  data = utils_1$1.toArray(data, enc);
  var p = new Position();
  if (data[p.place++] !== 0x30) {
    return false;
  }
  var len = getLength(data, p);
  if (len === false) {
    return false;
  }
  if ((len + p.place) !== data.length) {
    return false;
  }
  if (data[p.place++] !== 0x02) {
    return false;
  }
  var rlen = getLength(data, p);
  if (rlen === false) {
    return false;
  }
  var r = data.slice(p.place, rlen + p.place);
  p.place += rlen;
  if (data[p.place++] !== 0x02) {
    return false;
  }
  var slen = getLength(data, p);
  if (slen === false) {
    return false;
  }
  if (data.length !== slen + p.place) {
    return false;
  }
  var s = data.slice(p.place, slen + p.place);
  if (r[0] === 0) {
    if (r[1] & 0x80) {
      r = r.slice(1);
    } else {
      // Leading zeroes
      return false;
    }
  }
  if (s[0] === 0) {
    if (s[1] & 0x80) {
      s = s.slice(1);
    } else {
      // Leading zeroes
      return false;
    }
  }

  this.r = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(r);
  this.s = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(s);
  this.recoveryParam = null;

  return true;
};

function constructLength(arr, len) {
  if (len < 0x80) {
    arr.push(len);
    return;
  }
  var octets = 1 + (Math.log(len) / Math.LN2 >>> 3);
  arr.push(octets | 0x80);
  while (--octets) {
    arr.push((len >>> (octets << 3)) & 0xff);
  }
  arr.push(len);
}

Signature.prototype.toDER = function toDER(enc) {
  var r = this.r.toArray();
  var s = this.s.toArray();

  // Pad values
  if (r[0] & 0x80)
    r = [ 0 ].concat(r);
  // Pad values
  if (s[0] & 0x80)
    s = [ 0 ].concat(s);

  r = rmPadding(r);
  s = rmPadding(s);

  while (!s[0] && !(s[1] & 0x80)) {
    s = s.slice(1);
  }
  var arr = [ 0x02 ];
  constructLength(arr, r.length);
  arr = arr.concat(r);
  arr.push(0x02);
  constructLength(arr, s.length);
  var backHalf = arr.concat(s);
  var res = [ 0x30 ];
  constructLength(res, backHalf.length);
  res = res.concat(backHalf);
  return utils_1$1.encode(res, enc);
};

'use strict';





var rand = /*RicMoo:ethers:require(brorand)*/(function() { throw new Error('unsupported'); });
var assert$5 = utils_1$1.assert;




function EC(options) {
  if (!(this instanceof EC))
    return new EC(options);

  // Shortcut `elliptic.ec(curve-name)`
  if (typeof options === 'string') {
    assert$5(Object.prototype.hasOwnProperty.call(curves_1, options),
      'Unknown curve ' + options);

    options = curves_1[options];
  }

  // Shortcut for `elliptic.ec(elliptic.curves.curveName)`
  if (options instanceof curves_1.PresetCurve)
    options = { curve: options };

  this.curve = options.curve.curve;
  this.n = this.curve.n;
  this.nh = this.n.ushrn(1);
  this.g = this.curve.g;

  // Point on curve
  this.g = options.curve.g;
  this.g.precompute(options.curve.n.bitLength() + 1);

  // Hash for function for DRBG
  this.hash = options.hash || options.curve.hash;
}
var ec = EC;

EC.prototype.keyPair = function keyPair(options) {
  return new key(this, options);
};

EC.prototype.keyFromPrivate = function keyFromPrivate(priv, enc) {
  return key.fromPrivate(this, priv, enc);
};

EC.prototype.keyFromPublic = function keyFromPublic(pub, enc) {
  return key.fromPublic(this, pub, enc);
};

EC.prototype.genKeyPair = function genKeyPair(options) {
  if (!options)
    options = {};

  // Instantiate Hmac_DRBG
  var drbg = new hmacDrbg({
    hash: this.hash,
    pers: options.pers,
    persEnc: options.persEnc || 'utf8',
    entropy: options.entropy || rand(this.hash.hmacStrength),
    entropyEnc: options.entropy && options.entropyEnc || 'utf8',
    nonce: this.n.toArray(),
  });

  var bytes = this.n.byteLength();
  var ns2 = this.n.sub(new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(2));
  for (;;) {
    var priv = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(drbg.generate(bytes));
    if (priv.cmp(ns2) > 0)
      continue;

    priv.iaddn(1);
    return this.keyFromPrivate(priv);
  }
};

EC.prototype._truncateToN = function _truncateToN(msg, truncOnly) {
  var delta = msg.byteLength() * 8 - this.n.bitLength();
  if (delta > 0)
    msg = msg.ushrn(delta);
  if (!truncOnly && msg.cmp(this.n) >= 0)
    return msg.sub(this.n);
  else
    return msg;
};

EC.prototype.sign = function sign(msg, key, enc, options) {
  if (typeof enc === 'object') {
    options = enc;
    enc = null;
  }
  if (!options)
    options = {};

  key = this.keyFromPrivate(key, enc);
  msg = this._truncateToN(new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(msg, 16));

  // Zero-extend key to provide enough entropy
  var bytes = this.n.byteLength();
  var bkey = key.getPrivate().toArray('be', bytes);

  // Zero-extend nonce to have the same byte size as N
  var nonce = msg.toArray('be', bytes);

  // Instantiate Hmac_DRBG
  var drbg = new hmacDrbg({
    hash: this.hash,
    entropy: bkey,
    nonce: nonce,
    pers: options.pers,
    persEnc: options.persEnc || 'utf8',
  });

  // Number of bytes to generate
  var ns1 = this.n.sub(new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(1));

  for (var iter = 0; ; iter++) {
    var k = options.k ?
      options.k(iter) :
      new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(drbg.generate(this.n.byteLength()));
    k = this._truncateToN(k, true);
    if (k.cmpn(1) <= 0 || k.cmp(ns1) >= 0)
      continue;

    var kp = this.g.mul(k);
    if (kp.isInfinity())
      continue;

    var kpX = kp.getX();
    var r = kpX.umod(this.n);
    if (r.cmpn(0) === 0)
      continue;

    var s = k.invm(this.n).mul(r.mul(key.getPrivate()).iadd(msg));
    s = s.umod(this.n);
    if (s.cmpn(0) === 0)
      continue;

    var recoveryParam = (kp.getY().isOdd() ? 1 : 0) |
                        (kpX.cmp(r) !== 0 ? 2 : 0);

    // Use complement of `s`, if it is > `n / 2`
    if (options.canonical && s.cmp(this.nh) > 0) {
      s = this.n.sub(s);
      recoveryParam ^= 1;
    }

    return new signature({ r: r, s: s, recoveryParam: recoveryParam });
  }
};

EC.prototype.verify = function verify(msg, signature$1, key, enc) {
  msg = this._truncateToN(new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(msg, 16));
  key = this.keyFromPublic(key, enc);
  signature$1 = new signature(signature$1, 'hex');

  // Perform primitive values validation
  var r = signature$1.r;
  var s = signature$1.s;
  if (r.cmpn(1) < 0 || r.cmp(this.n) >= 0)
    return false;
  if (s.cmpn(1) < 0 || s.cmp(this.n) >= 0)
    return false;

  // Validate signature
  var sinv = s.invm(this.n);
  var u1 = sinv.mul(msg).umod(this.n);
  var u2 = sinv.mul(r).umod(this.n);
  var p;

  if (!this.curve._maxwellTrick) {
    p = this.g.mulAdd(u1, key.getPublic(), u2);
    if (p.isInfinity())
      return false;

    return p.getX().umod(this.n).cmp(r) === 0;
  }

  // NOTE: Greg Maxwell's trick, inspired by:
  // https://git.io/vad3K

  p = this.g.jmulAdd(u1, key.getPublic(), u2);
  if (p.isInfinity())
    return false;

  // Compare `p.x` of Jacobian point with `r`,
  // this will do `p.x == r * p.z^2` instead of multiplying `p.x` by the
  // inverse of `p.z^2`
  return p.eqXToP(r);
};

EC.prototype.recoverPubKey = function(msg, signature$1, j, enc) {
  assert$5((3 & j) === j, 'The recovery param is more than two bits');
  signature$1 = new signature(signature$1, enc);

  var n = this.n;
  var e = new (bn_js__WEBPACK_IMPORTED_MODULE_0___default())(msg);
  var r = signature$1.r;
  var s = signature$1.s;

  // A set LSB signifies that the y-coordinate is odd
  var isYOdd = j & 1;
  var isSecondKey = j >> 1;
  if (r.cmp(this.curve.p.umod(this.curve.n)) >= 0 && isSecondKey)
    throw new Error('Unable to find sencond key candinate');

  // 1.1. Let x = r + jn.
  if (isSecondKey)
    r = this.curve.pointFromX(r.add(this.curve.n), isYOdd);
  else
    r = this.curve.pointFromX(r, isYOdd);

  var rInv = signature$1.r.invm(n);
  var s1 = n.sub(e).mul(rInv).umod(n);
  var s2 = s.mul(rInv).umod(n);

  // 1.6.1 Compute Q = r^-1 (sR -  eG)
  //               Q = r^-1 (sR + -eG)
  return this.g.mulAdd(s1, r, s2);
};

EC.prototype.getKeyRecoveryParam = function(e, signature$1, Q, enc) {
  signature$1 = new signature(signature$1, enc);
  if (signature$1.recoveryParam !== null)
    return signature$1.recoveryParam;

  for (var i = 0; i < 4; i++) {
    var Qprime;
    try {
      Qprime = this.recoverPubKey(e, signature$1, i);
    } catch (e) {
      continue;
    }

    if (Qprime.eq(Q))
      return i;
  }
  throw new Error('Unable to find valid recovery factor');
};

var elliptic_1 = createCommonjsModule(function (module, exports) {
'use strict';

var elliptic = exports;

elliptic.version = /*RicMoo:ethers*/{ version: "6.5.4" }.version;
elliptic.utils = utils_1$1;
elliptic.rand = /*RicMoo:ethers:require(brorand)*/(function() { throw new Error('unsupported'); });
elliptic.curve = curve_1;
elliptic.curves = curves_1;

// Protocols
elliptic.ec = ec;
elliptic.eddsa = /*RicMoo:ethers:require(./elliptic/eddsa)*/(null);
});

var EC$1 = elliptic_1.ec;


//# sourceMappingURL=elliptic.js.map


/***/ }),

/***/ "./node_modules/@ethersproject/signing-key/lib.esm/index.js":
/*!******************************************************************!*\
  !*** ./node_modules/@ethersproject/signing-key/lib.esm/index.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SigningKey": () => (/* binding */ SigningKey),
/* harmony export */   "computePublicKey": () => (/* binding */ computePublicKey),
/* harmony export */   "recoverPublicKey": () => (/* binding */ recoverPublicKey)
/* harmony export */ });
/* harmony import */ var _elliptic__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./elliptic */ "./node_modules/@ethersproject/signing-key/lib.esm/elliptic.js");
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @ethersproject/properties */ "./node_modules/@ethersproject/properties/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/signing-key/lib.esm/_version.js");






const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
let _curve = null;
function getCurve() {
    if (!_curve) {
        _curve = new _elliptic__WEBPACK_IMPORTED_MODULE_2__.EC("secp256k1");
    }
    return _curve;
}
class SigningKey {
    constructor(privateKey) {
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "curve", "secp256k1");
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "privateKey", (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.hexlify)(privateKey));
        if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.hexDataLength)(this.privateKey) !== 32) {
            logger.throwArgumentError("invalid private key", "privateKey", "[[ REDACTED ]]");
        }
        const keyPair = getCurve().keyFromPrivate((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.arrayify)(this.privateKey));
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "publicKey", "0x" + keyPair.getPublic(false, "hex"));
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "compressedPublicKey", "0x" + keyPair.getPublic(true, "hex"));
        (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__.defineReadOnly)(this, "_isSigningKey", true);
    }
    _addPoint(other) {
        const p0 = getCurve().keyFromPublic((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.arrayify)(this.publicKey));
        const p1 = getCurve().keyFromPublic((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.arrayify)(other));
        return "0x" + p0.pub.add(p1.pub).encodeCompressed("hex");
    }
    signDigest(digest) {
        const keyPair = getCurve().keyFromPrivate((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.arrayify)(this.privateKey));
        const digestBytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.arrayify)(digest);
        if (digestBytes.length !== 32) {
            logger.throwArgumentError("bad digest length", "digest", digest);
        }
        const signature = keyPair.sign(digestBytes, { canonical: true });
        return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.splitSignature)({
            recoveryParam: signature.recoveryParam,
            r: (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.hexZeroPad)("0x" + signature.r.toString(16), 32),
            s: (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.hexZeroPad)("0x" + signature.s.toString(16), 32),
        });
    }
    computeSharedSecret(otherKey) {
        const keyPair = getCurve().keyFromPrivate((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.arrayify)(this.privateKey));
        const otherKeyPair = getCurve().keyFromPublic((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.arrayify)(computePublicKey(otherKey)));
        return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.hexZeroPad)("0x" + keyPair.derive(otherKeyPair.getPublic()).toString(16), 32);
    }
    static isSigningKey(value) {
        return !!(value && value._isSigningKey);
    }
}
function recoverPublicKey(digest, signature) {
    const sig = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.splitSignature)(signature);
    const rs = { r: (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.arrayify)(sig.r), s: (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.arrayify)(sig.s) };
    return "0x" + getCurve().recoverPubKey((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.arrayify)(digest), rs, sig.recoveryParam).encode("hex", false);
}
function computePublicKey(key, compressed) {
    const bytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.arrayify)(key);
    if (bytes.length === 32) {
        const signingKey = new SigningKey(bytes);
        if (compressed) {
            return "0x" + getCurve().keyFromPrivate(bytes).getPublic(true, "hex");
        }
        return signingKey.publicKey;
    }
    else if (bytes.length === 33) {
        if (compressed) {
            return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.hexlify)(bytes);
        }
        return "0x" + getCurve().keyFromPublic(bytes).getPublic(false, "hex");
    }
    else if (bytes.length === 65) {
        if (!compressed) {
            return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_4__.hexlify)(bytes);
        }
        return "0x" + getCurve().keyFromPublic(bytes).getPublic(true, "hex");
    }
    return logger.throwArgumentError("invalid public or private key", "key", "[REDACTED]");
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/strings/lib.esm/_version.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@ethersproject/strings/lib.esm/_version.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "strings/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/strings/lib.esm/utf8.js":
/*!*************************************************************!*\
  !*** ./node_modules/@ethersproject/strings/lib.esm/utf8.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "UnicodeNormalizationForm": () => (/* binding */ UnicodeNormalizationForm),
/* harmony export */   "Utf8ErrorFuncs": () => (/* binding */ Utf8ErrorFuncs),
/* harmony export */   "Utf8ErrorReason": () => (/* binding */ Utf8ErrorReason),
/* harmony export */   "_toEscapedUtf8String": () => (/* binding */ _toEscapedUtf8String),
/* harmony export */   "_toUtf8String": () => (/* binding */ _toUtf8String),
/* harmony export */   "toUtf8Bytes": () => (/* binding */ toUtf8Bytes),
/* harmony export */   "toUtf8CodePoints": () => (/* binding */ toUtf8CodePoints),
/* harmony export */   "toUtf8String": () => (/* binding */ toUtf8String)
/* harmony export */ });
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/strings/lib.esm/_version.js");




const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
///////////////////////////////
var UnicodeNormalizationForm;
(function (UnicodeNormalizationForm) {
    UnicodeNormalizationForm["current"] = "";
    UnicodeNormalizationForm["NFC"] = "NFC";
    UnicodeNormalizationForm["NFD"] = "NFD";
    UnicodeNormalizationForm["NFKC"] = "NFKC";
    UnicodeNormalizationForm["NFKD"] = "NFKD";
})(UnicodeNormalizationForm || (UnicodeNormalizationForm = {}));
;
var Utf8ErrorReason;
(function (Utf8ErrorReason) {
    // A continuation byte was present where there was nothing to continue
    // - offset = the index the codepoint began in
    Utf8ErrorReason["UNEXPECTED_CONTINUE"] = "unexpected continuation byte";
    // An invalid (non-continuation) byte to start a UTF-8 codepoint was found
    // - offset = the index the codepoint began in
    Utf8ErrorReason["BAD_PREFIX"] = "bad codepoint prefix";
    // The string is too short to process the expected codepoint
    // - offset = the index the codepoint began in
    Utf8ErrorReason["OVERRUN"] = "string overrun";
    // A missing continuation byte was expected but not found
    // - offset = the index the continuation byte was expected at
    Utf8ErrorReason["MISSING_CONTINUE"] = "missing continuation byte";
    // The computed code point is outside the range for UTF-8
    // - offset       = start of this codepoint
    // - badCodepoint = the computed codepoint; outside the UTF-8 range
    Utf8ErrorReason["OUT_OF_RANGE"] = "out of UTF-8 range";
    // UTF-8 strings may not contain UTF-16 surrogate pairs
    // - offset       = start of this codepoint
    // - badCodepoint = the computed codepoint; inside the UTF-16 surrogate range
    Utf8ErrorReason["UTF16_SURROGATE"] = "UTF-16 surrogate";
    // The string is an overlong representation
    // - offset       = start of this codepoint
    // - badCodepoint = the computed codepoint; already bounds checked
    Utf8ErrorReason["OVERLONG"] = "overlong representation";
})(Utf8ErrorReason || (Utf8ErrorReason = {}));
;
function errorFunc(reason, offset, bytes, output, badCodepoint) {
    return logger.throwArgumentError(`invalid codepoint at offset ${offset}; ${reason}`, "bytes", bytes);
}
function ignoreFunc(reason, offset, bytes, output, badCodepoint) {
    // If there is an invalid prefix (including stray continuation), skip any additional continuation bytes
    if (reason === Utf8ErrorReason.BAD_PREFIX || reason === Utf8ErrorReason.UNEXPECTED_CONTINUE) {
        let i = 0;
        for (let o = offset + 1; o < bytes.length; o++) {
            if (bytes[o] >> 6 !== 0x02) {
                break;
            }
            i++;
        }
        return i;
    }
    // This byte runs us past the end of the string, so just jump to the end
    // (but the first byte was read already read and therefore skipped)
    if (reason === Utf8ErrorReason.OVERRUN) {
        return bytes.length - offset - 1;
    }
    // Nothing to skip
    return 0;
}
function replaceFunc(reason, offset, bytes, output, badCodepoint) {
    // Overlong representations are otherwise "valid" code points; just non-deistingtished
    if (reason === Utf8ErrorReason.OVERLONG) {
        output.push(badCodepoint);
        return 0;
    }
    // Put the replacement character into the output
    output.push(0xfffd);
    // Otherwise, process as if ignoring errors
    return ignoreFunc(reason, offset, bytes, output, badCodepoint);
}
// Common error handing strategies
const Utf8ErrorFuncs = Object.freeze({
    error: errorFunc,
    ignore: ignoreFunc,
    replace: replaceFunc
});
// http://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript#13691499
function getUtf8CodePoints(bytes, onError) {
    if (onError == null) {
        onError = Utf8ErrorFuncs.error;
    }
    bytes = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.arrayify)(bytes);
    const result = [];
    let i = 0;
    // Invalid bytes are ignored
    while (i < bytes.length) {
        const c = bytes[i++];
        // 0xxx xxxx
        if (c >> 7 === 0) {
            result.push(c);
            continue;
        }
        // Multibyte; how many bytes left for this character?
        let extraLength = null;
        let overlongMask = null;
        // 110x xxxx 10xx xxxx
        if ((c & 0xe0) === 0xc0) {
            extraLength = 1;
            overlongMask = 0x7f;
            // 1110 xxxx 10xx xxxx 10xx xxxx
        }
        else if ((c & 0xf0) === 0xe0) {
            extraLength = 2;
            overlongMask = 0x7ff;
            // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
        }
        else if ((c & 0xf8) === 0xf0) {
            extraLength = 3;
            overlongMask = 0xffff;
        }
        else {
            if ((c & 0xc0) === 0x80) {
                i += onError(Utf8ErrorReason.UNEXPECTED_CONTINUE, i - 1, bytes, result);
            }
            else {
                i += onError(Utf8ErrorReason.BAD_PREFIX, i - 1, bytes, result);
            }
            continue;
        }
        // Do we have enough bytes in our data?
        if (i - 1 + extraLength >= bytes.length) {
            i += onError(Utf8ErrorReason.OVERRUN, i - 1, bytes, result);
            continue;
        }
        // Remove the length prefix from the char
        let res = c & ((1 << (8 - extraLength - 1)) - 1);
        for (let j = 0; j < extraLength; j++) {
            let nextChar = bytes[i];
            // Invalid continuation byte
            if ((nextChar & 0xc0) != 0x80) {
                i += onError(Utf8ErrorReason.MISSING_CONTINUE, i, bytes, result);
                res = null;
                break;
            }
            ;
            res = (res << 6) | (nextChar & 0x3f);
            i++;
        }
        // See above loop for invalid continuation byte
        if (res === null) {
            continue;
        }
        // Maximum code point
        if (res > 0x10ffff) {
            i += onError(Utf8ErrorReason.OUT_OF_RANGE, i - 1 - extraLength, bytes, result, res);
            continue;
        }
        // Reserved for UTF-16 surrogate halves
        if (res >= 0xd800 && res <= 0xdfff) {
            i += onError(Utf8ErrorReason.UTF16_SURROGATE, i - 1 - extraLength, bytes, result, res);
            continue;
        }
        // Check for overlong sequences (more bytes than needed)
        if (res <= overlongMask) {
            i += onError(Utf8ErrorReason.OVERLONG, i - 1 - extraLength, bytes, result, res);
            continue;
        }
        result.push(res);
    }
    return result;
}
// http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
function toUtf8Bytes(str, form = UnicodeNormalizationForm.current) {
    if (form != UnicodeNormalizationForm.current) {
        logger.checkNormalize();
        str = str.normalize(form);
    }
    let result = [];
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (c < 0x80) {
            result.push(c);
        }
        else if (c < 0x800) {
            result.push((c >> 6) | 0xc0);
            result.push((c & 0x3f) | 0x80);
        }
        else if ((c & 0xfc00) == 0xd800) {
            i++;
            const c2 = str.charCodeAt(i);
            if (i >= str.length || (c2 & 0xfc00) !== 0xdc00) {
                throw new Error("invalid utf-8 string");
            }
            // Surrogate Pair
            const pair = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
            result.push((pair >> 18) | 0xf0);
            result.push(((pair >> 12) & 0x3f) | 0x80);
            result.push(((pair >> 6) & 0x3f) | 0x80);
            result.push((pair & 0x3f) | 0x80);
        }
        else {
            result.push((c >> 12) | 0xe0);
            result.push(((c >> 6) & 0x3f) | 0x80);
            result.push((c & 0x3f) | 0x80);
        }
    }
    return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__.arrayify)(result);
}
;
function escapeChar(value) {
    const hex = ("0000" + value.toString(16));
    return "\\u" + hex.substring(hex.length - 4);
}
function _toEscapedUtf8String(bytes, onError) {
    return '"' + getUtf8CodePoints(bytes, onError).map((codePoint) => {
        if (codePoint < 256) {
            switch (codePoint) {
                case 8: return "\\b";
                case 9: return "\\t";
                case 10: return "\\n";
                case 13: return "\\r";
                case 34: return "\\\"";
                case 92: return "\\\\";
            }
            if (codePoint >= 32 && codePoint < 127) {
                return String.fromCharCode(codePoint);
            }
        }
        if (codePoint <= 0xffff) {
            return escapeChar(codePoint);
        }
        codePoint -= 0x10000;
        return escapeChar(((codePoint >> 10) & 0x3ff) + 0xd800) + escapeChar((codePoint & 0x3ff) + 0xdc00);
    }).join("") + '"';
}
function _toUtf8String(codePoints) {
    return codePoints.map((codePoint) => {
        if (codePoint <= 0xffff) {
            return String.fromCharCode(codePoint);
        }
        codePoint -= 0x10000;
        return String.fromCharCode((((codePoint >> 10) & 0x3ff) + 0xd800), ((codePoint & 0x3ff) + 0xdc00));
    }).join("");
}
function toUtf8String(bytes, onError) {
    return _toUtf8String(getUtf8CodePoints(bytes, onError));
}
function toUtf8CodePoints(str, form = UnicodeNormalizationForm.current) {
    return getUtf8CodePoints(toUtf8Bytes(str, form));
}
//# sourceMappingURL=utf8.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/transactions/lib.esm/_version.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@ethersproject/transactions/lib.esm/_version.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "transactions/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/transactions/lib.esm/index.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@ethersproject/transactions/lib.esm/index.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TransactionTypes": () => (/* binding */ TransactionTypes),
/* harmony export */   "accessListify": () => (/* binding */ accessListify),
/* harmony export */   "computeAddress": () => (/* binding */ computeAddress),
/* harmony export */   "parse": () => (/* binding */ parse),
/* harmony export */   "recoverAddress": () => (/* binding */ recoverAddress),
/* harmony export */   "serialize": () => (/* binding */ serialize)
/* harmony export */ });
/* harmony import */ var _ethersproject_address__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/address */ "./node_modules/@ethersproject/address/lib.esm/index.js");
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @ethersproject/bignumber */ "./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js");
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @ethersproject/bytes */ "./node_modules/@ethersproject/bytes/lib.esm/index.js");
/* harmony import */ var _ethersproject_constants__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @ethersproject/constants */ "./node_modules/@ethersproject/constants/lib.esm/bignumbers.js");
/* harmony import */ var _ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @ethersproject/keccak256 */ "./node_modules/@ethersproject/keccak256/lib.esm/index.js");
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @ethersproject/properties */ "./node_modules/@ethersproject/properties/lib.esm/index.js");
/* harmony import */ var _ethersproject_rlp__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @ethersproject/rlp */ "./node_modules/@ethersproject/rlp/lib.esm/index.js");
/* harmony import */ var _ethersproject_signing_key__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @ethersproject/signing-key */ "./node_modules/@ethersproject/signing-key/lib.esm/index.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/transactions/lib.esm/_version.js");











const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
var TransactionTypes;
(function (TransactionTypes) {
    TransactionTypes[TransactionTypes["legacy"] = 0] = "legacy";
    TransactionTypes[TransactionTypes["eip2930"] = 1] = "eip2930";
    TransactionTypes[TransactionTypes["eip1559"] = 2] = "eip1559";
})(TransactionTypes || (TransactionTypes = {}));
;
///////////////////////////////
function handleAddress(value) {
    if (value === "0x") {
        return null;
    }
    return (0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_2__.getAddress)(value);
}
function handleNumber(value) {
    if (value === "0x") {
        return _ethersproject_constants__WEBPACK_IMPORTED_MODULE_3__.Zero;
    }
    return _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(value);
}
// Legacy Transaction Fields
const transactionFields = [
    { name: "nonce", maxLength: 32, numeric: true },
    { name: "gasPrice", maxLength: 32, numeric: true },
    { name: "gasLimit", maxLength: 32, numeric: true },
    { name: "to", length: 20 },
    { name: "value", maxLength: 32, numeric: true },
    { name: "data" },
];
const allowedTransactionKeys = {
    chainId: true, data: true, gasLimit: true, gasPrice: true, nonce: true, to: true, type: true, value: true
};
function computeAddress(key) {
    const publicKey = (0,_ethersproject_signing_key__WEBPACK_IMPORTED_MODULE_5__.computePublicKey)(key);
    return (0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_2__.getAddress)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexDataSlice)((0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_7__.keccak256)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexDataSlice)(publicKey, 1)), 12));
}
function recoverAddress(digest, signature) {
    return computeAddress((0,_ethersproject_signing_key__WEBPACK_IMPORTED_MODULE_5__.recoverPublicKey)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.arrayify)(digest), signature));
}
function formatNumber(value, name) {
    const result = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.stripZeros)(_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(value).toHexString());
    if (result.length > 32) {
        logger.throwArgumentError("invalid length for " + name, ("transaction:" + name), value);
    }
    return result;
}
function accessSetify(addr, storageKeys) {
    return {
        address: (0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_2__.getAddress)(addr),
        storageKeys: (storageKeys || []).map((storageKey, index) => {
            if ((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexDataLength)(storageKey) !== 32) {
                logger.throwArgumentError("invalid access list storageKey", `accessList[${addr}:${index}]`, storageKey);
            }
            return storageKey.toLowerCase();
        })
    };
}
function accessListify(value) {
    if (Array.isArray(value)) {
        return value.map((set, index) => {
            if (Array.isArray(set)) {
                if (set.length > 2) {
                    logger.throwArgumentError("access list expected to be [ address, storageKeys[] ]", `value[${index}]`, set);
                }
                return accessSetify(set[0], set[1]);
            }
            return accessSetify(set.address, set.storageKeys);
        });
    }
    const result = Object.keys(value).map((addr) => {
        const storageKeys = value[addr].reduce((accum, storageKey) => {
            accum[storageKey] = true;
            return accum;
        }, {});
        return accessSetify(addr, Object.keys(storageKeys).sort());
    });
    result.sort((a, b) => (a.address.localeCompare(b.address)));
    return result;
}
function formatAccessList(value) {
    return accessListify(value).map((set) => [set.address, set.storageKeys]);
}
function _serializeEip1559(transaction, signature) {
    // If there is an explicit gasPrice, make sure it matches the
    // EIP-1559 fees; otherwise they may not understand what they
    // think they are setting in terms of fee.
    if (transaction.gasPrice != null) {
        const gasPrice = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(transaction.gasPrice);
        const maxFeePerGas = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(transaction.maxFeePerGas || 0);
        if (!gasPrice.eq(maxFeePerGas)) {
            logger.throwArgumentError("mismatch EIP-1559 gasPrice != maxFeePerGas", "tx", {
                gasPrice, maxFeePerGas
            });
        }
    }
    const fields = [
        formatNumber(transaction.chainId || 0, "chainId"),
        formatNumber(transaction.nonce || 0, "nonce"),
        formatNumber(transaction.maxPriorityFeePerGas || 0, "maxPriorityFeePerGas"),
        formatNumber(transaction.maxFeePerGas || 0, "maxFeePerGas"),
        formatNumber(transaction.gasLimit || 0, "gasLimit"),
        ((transaction.to != null) ? (0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_2__.getAddress)(transaction.to) : "0x"),
        formatNumber(transaction.value || 0, "value"),
        (transaction.data || "0x"),
        (formatAccessList(transaction.accessList || []))
    ];
    if (signature) {
        const sig = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.splitSignature)(signature);
        fields.push(formatNumber(sig.recoveryParam, "recoveryParam"));
        fields.push((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.stripZeros)(sig.r));
        fields.push((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.stripZeros)(sig.s));
    }
    return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexConcat)(["0x02", _ethersproject_rlp__WEBPACK_IMPORTED_MODULE_8__.encode(fields)]);
}
function _serializeEip2930(transaction, signature) {
    const fields = [
        formatNumber(transaction.chainId || 0, "chainId"),
        formatNumber(transaction.nonce || 0, "nonce"),
        formatNumber(transaction.gasPrice || 0, "gasPrice"),
        formatNumber(transaction.gasLimit || 0, "gasLimit"),
        ((transaction.to != null) ? (0,_ethersproject_address__WEBPACK_IMPORTED_MODULE_2__.getAddress)(transaction.to) : "0x"),
        formatNumber(transaction.value || 0, "value"),
        (transaction.data || "0x"),
        (formatAccessList(transaction.accessList || []))
    ];
    if (signature) {
        const sig = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.splitSignature)(signature);
        fields.push(formatNumber(sig.recoveryParam, "recoveryParam"));
        fields.push((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.stripZeros)(sig.r));
        fields.push((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.stripZeros)(sig.s));
    }
    return (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexConcat)(["0x01", _ethersproject_rlp__WEBPACK_IMPORTED_MODULE_8__.encode(fields)]);
}
// Legacy Transactions and EIP-155
function _serialize(transaction, signature) {
    (0,_ethersproject_properties__WEBPACK_IMPORTED_MODULE_9__.checkProperties)(transaction, allowedTransactionKeys);
    const raw = [];
    transactionFields.forEach(function (fieldInfo) {
        let value = transaction[fieldInfo.name] || ([]);
        const options = {};
        if (fieldInfo.numeric) {
            options.hexPad = "left";
        }
        value = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.arrayify)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexlify)(value, options));
        // Fixed-width field
        if (fieldInfo.length && value.length !== fieldInfo.length && value.length > 0) {
            logger.throwArgumentError("invalid length for " + fieldInfo.name, ("transaction:" + fieldInfo.name), value);
        }
        // Variable-width (with a maximum)
        if (fieldInfo.maxLength) {
            value = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.stripZeros)(value);
            if (value.length > fieldInfo.maxLength) {
                logger.throwArgumentError("invalid length for " + fieldInfo.name, ("transaction:" + fieldInfo.name), value);
            }
        }
        raw.push((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexlify)(value));
    });
    let chainId = 0;
    if (transaction.chainId != null) {
        // A chainId was provided; if non-zero we'll use EIP-155
        chainId = transaction.chainId;
        if (typeof (chainId) !== "number") {
            logger.throwArgumentError("invalid transaction.chainId", "transaction", transaction);
        }
    }
    else if (signature && !(0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.isBytesLike)(signature) && signature.v > 28) {
        // No chainId provided, but the signature is signing with EIP-155; derive chainId
        chainId = Math.floor((signature.v - 35) / 2);
    }
    // We have an EIP-155 transaction (chainId was specified and non-zero)
    if (chainId !== 0) {
        raw.push((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexlify)(chainId)); // @TODO: hexValue?
        raw.push("0x");
        raw.push("0x");
    }
    // Requesting an unsigned transaction
    if (!signature) {
        return _ethersproject_rlp__WEBPACK_IMPORTED_MODULE_8__.encode(raw);
    }
    // The splitSignature will ensure the transaction has a recoveryParam in the
    // case that the signTransaction function only adds a v.
    const sig = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.splitSignature)(signature);
    // We pushed a chainId and null r, s on for hashing only; remove those
    let v = 27 + sig.recoveryParam;
    if (chainId !== 0) {
        raw.pop();
        raw.pop();
        raw.pop();
        v += chainId * 2 + 8;
        // If an EIP-155 v (directly or indirectly; maybe _vs) was provided, check it!
        if (sig.v > 28 && sig.v !== v) {
            logger.throwArgumentError("transaction.chainId/signature.v mismatch", "signature", signature);
        }
    }
    else if (sig.v !== v) {
        logger.throwArgumentError("transaction.chainId/signature.v mismatch", "signature", signature);
    }
    raw.push((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexlify)(v));
    raw.push((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.stripZeros)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.arrayify)(sig.r)));
    raw.push((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.stripZeros)((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.arrayify)(sig.s)));
    return _ethersproject_rlp__WEBPACK_IMPORTED_MODULE_8__.encode(raw);
}
function serialize(transaction, signature) {
    // Legacy and EIP-155 Transactions
    if (transaction.type == null || transaction.type === 0) {
        if (transaction.accessList != null) {
            logger.throwArgumentError("untyped transactions do not support accessList; include type: 1", "transaction", transaction);
        }
        return _serialize(transaction, signature);
    }
    // Typed Transactions (EIP-2718)
    switch (transaction.type) {
        case 1:
            return _serializeEip2930(transaction, signature);
        case 2:
            return _serializeEip1559(transaction, signature);
        default:
            break;
    }
    return logger.throwError(`unsupported transaction type: ${transaction.type}`, _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
        operation: "serializeTransaction",
        transactionType: transaction.type
    });
}
function _parseEipSignature(tx, fields, serialize) {
    try {
        const recid = handleNumber(fields[0]).toNumber();
        if (recid !== 0 && recid !== 1) {
            throw new Error("bad recid");
        }
        tx.v = recid;
    }
    catch (error) {
        logger.throwArgumentError("invalid v for transaction type: 1", "v", fields[0]);
    }
    tx.r = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexZeroPad)(fields[1], 32);
    tx.s = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexZeroPad)(fields[2], 32);
    try {
        const digest = (0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_7__.keccak256)(serialize(tx));
        tx.from = recoverAddress(digest, { r: tx.r, s: tx.s, recoveryParam: tx.v });
    }
    catch (error) { }
}
function _parseEip1559(payload) {
    const transaction = _ethersproject_rlp__WEBPACK_IMPORTED_MODULE_8__.decode(payload.slice(1));
    if (transaction.length !== 9 && transaction.length !== 12) {
        logger.throwArgumentError("invalid component count for transaction type: 2", "payload", (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexlify)(payload));
    }
    const maxPriorityFeePerGas = handleNumber(transaction[2]);
    const maxFeePerGas = handleNumber(transaction[3]);
    const tx = {
        type: 2,
        chainId: handleNumber(transaction[0]).toNumber(),
        nonce: handleNumber(transaction[1]).toNumber(),
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        maxFeePerGas: maxFeePerGas,
        gasPrice: null,
        gasLimit: handleNumber(transaction[4]),
        to: handleAddress(transaction[5]),
        value: handleNumber(transaction[6]),
        data: transaction[7],
        accessList: accessListify(transaction[8]),
    };
    // Unsigned EIP-1559 Transaction
    if (transaction.length === 9) {
        return tx;
    }
    tx.hash = (0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_7__.keccak256)(payload);
    _parseEipSignature(tx, transaction.slice(9), _serializeEip1559);
    return tx;
}
function _parseEip2930(payload) {
    const transaction = _ethersproject_rlp__WEBPACK_IMPORTED_MODULE_8__.decode(payload.slice(1));
    if (transaction.length !== 8 && transaction.length !== 11) {
        logger.throwArgumentError("invalid component count for transaction type: 1", "payload", (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexlify)(payload));
    }
    const tx = {
        type: 1,
        chainId: handleNumber(transaction[0]).toNumber(),
        nonce: handleNumber(transaction[1]).toNumber(),
        gasPrice: handleNumber(transaction[2]),
        gasLimit: handleNumber(transaction[3]),
        to: handleAddress(transaction[4]),
        value: handleNumber(transaction[5]),
        data: transaction[6],
        accessList: accessListify(transaction[7])
    };
    // Unsigned EIP-2930 Transaction
    if (transaction.length === 8) {
        return tx;
    }
    tx.hash = (0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_7__.keccak256)(payload);
    _parseEipSignature(tx, transaction.slice(8), _serializeEip2930);
    return tx;
}
// Legacy Transactions and EIP-155
function _parse(rawTransaction) {
    const transaction = _ethersproject_rlp__WEBPACK_IMPORTED_MODULE_8__.decode(rawTransaction);
    if (transaction.length !== 9 && transaction.length !== 6) {
        logger.throwArgumentError("invalid raw transaction", "rawTransaction", rawTransaction);
    }
    const tx = {
        nonce: handleNumber(transaction[0]).toNumber(),
        gasPrice: handleNumber(transaction[1]),
        gasLimit: handleNumber(transaction[2]),
        to: handleAddress(transaction[3]),
        value: handleNumber(transaction[4]),
        data: transaction[5],
        chainId: 0
    };
    // Legacy unsigned transaction
    if (transaction.length === 6) {
        return tx;
    }
    try {
        tx.v = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(transaction[6]).toNumber();
    }
    catch (error) {
        // @TODO: What makes snese to do? The v is too big
        return tx;
    }
    tx.r = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexZeroPad)(transaction[7], 32);
    tx.s = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexZeroPad)(transaction[8], 32);
    if (_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(tx.r).isZero() && _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_4__.BigNumber.from(tx.s).isZero()) {
        // EIP-155 unsigned transaction
        tx.chainId = tx.v;
        tx.v = 0;
    }
    else {
        // Signed Transaction
        tx.chainId = Math.floor((tx.v - 35) / 2);
        if (tx.chainId < 0) {
            tx.chainId = 0;
        }
        let recoveryParam = tx.v - 27;
        const raw = transaction.slice(0, 6);
        if (tx.chainId !== 0) {
            raw.push((0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexlify)(tx.chainId));
            raw.push("0x");
            raw.push("0x");
            recoveryParam -= tx.chainId * 2 + 8;
        }
        const digest = (0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_7__.keccak256)(_ethersproject_rlp__WEBPACK_IMPORTED_MODULE_8__.encode(raw));
        try {
            tx.from = recoverAddress(digest, { r: (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexlify)(tx.r), s: (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.hexlify)(tx.s), recoveryParam: recoveryParam });
        }
        catch (error) { }
        tx.hash = (0,_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_7__.keccak256)(rawTransaction);
    }
    tx.type = null;
    return tx;
}
function parse(rawTransaction) {
    const payload = (0,_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_6__.arrayify)(rawTransaction);
    // Legacy and EIP-155 Transactions
    if (payload[0] > 0x7f) {
        return _parse(payload);
    }
    // Typed Transaction (EIP-2718)
    switch (payload[0]) {
        case 1:
            return _parseEip2930(payload);
        case 2:
            return _parseEip1559(payload);
        default:
            break;
    }
    return logger.throwError(`unsupported transaction type: ${payload[0]}`, _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger.errors.UNSUPPORTED_OPERATION, {
        operation: "parseTransaction",
        transactionType: payload[0]
    });
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/units/lib.esm/_version.js":
/*!***************************************************************!*\
  !*** ./node_modules/@ethersproject/units/lib.esm/_version.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "version": () => (/* binding */ version)
/* harmony export */ });
const version = "units/5.7.0";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ "./node_modules/@ethersproject/units/lib.esm/index.js":
/*!************************************************************!*\
  !*** ./node_modules/@ethersproject/units/lib.esm/index.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "commify": () => (/* binding */ commify),
/* harmony export */   "formatEther": () => (/* binding */ formatEther),
/* harmony export */   "formatUnits": () => (/* binding */ formatUnits),
/* harmony export */   "parseEther": () => (/* binding */ parseEther),
/* harmony export */   "parseUnits": () => (/* binding */ parseUnits)
/* harmony export */ });
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @ethersproject/bignumber */ "./node_modules/@ethersproject/bignumber/lib.esm/fixednumber.js");
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @ethersproject/logger */ "./node_modules/@ethersproject/logger/lib.esm/index.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_version */ "./node_modules/@ethersproject/units/lib.esm/_version.js");




const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_0__.Logger(_version__WEBPACK_IMPORTED_MODULE_1__.version);
const names = [
    "wei",
    "kwei",
    "mwei",
    "gwei",
    "szabo",
    "finney",
    "ether",
];
// Some environments have issues with RegEx that contain back-tracking, so we cannot
// use them.
function commify(value) {
    const comps = String(value).split(".");
    if (comps.length > 2 || !comps[0].match(/^-?[0-9]*$/) || (comps[1] && !comps[1].match(/^[0-9]*$/)) || value === "." || value === "-.") {
        logger.throwArgumentError("invalid value", "value", value);
    }
    // Make sure we have at least one whole digit (0 if none)
    let whole = comps[0];
    let negative = "";
    if (whole.substring(0, 1) === "-") {
        negative = "-";
        whole = whole.substring(1);
    }
    // Make sure we have at least 1 whole digit with no leading zeros
    while (whole.substring(0, 1) === "0") {
        whole = whole.substring(1);
    }
    if (whole === "") {
        whole = "0";
    }
    let suffix = "";
    if (comps.length === 2) {
        suffix = "." + (comps[1] || "0");
    }
    while (suffix.length > 2 && suffix[suffix.length - 1] === "0") {
        suffix = suffix.substring(0, suffix.length - 1);
    }
    const formatted = [];
    while (whole.length) {
        if (whole.length <= 3) {
            formatted.unshift(whole);
            break;
        }
        else {
            const index = whole.length - 3;
            formatted.unshift(whole.substring(index));
            whole = whole.substring(0, index);
        }
    }
    return negative + formatted.join(",") + suffix;
}
function formatUnits(value, unitName) {
    if (typeof (unitName) === "string") {
        const index = names.indexOf(unitName);
        if (index !== -1) {
            unitName = 3 * index;
        }
    }
    return (0,_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_2__.formatFixed)(value, (unitName != null) ? unitName : 18);
}
function parseUnits(value, unitName) {
    if (typeof (value) !== "string") {
        logger.throwArgumentError("value must be a string", "value", value);
    }
    if (typeof (unitName) === "string") {
        const index = names.indexOf(unitName);
        if (index !== -1) {
            unitName = 3 * index;
        }
    }
    return (0,_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_2__.parseFixed)(value, (unitName != null) ? unitName : 18);
}
function formatEther(wei) {
    return formatUnits(wei, 18);
}
function parseEther(ether) {
    return parseUnits(ether, 18);
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/bn.js/lib/bn.js":
/*!**************************************!*\
  !*** ./node_modules/bn.js/lib/bn.js ***!
  \**************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/* module decorator */ module = __webpack_require__.nmd(module);
(function (module, exports) {
  'use strict';

  // Utils
  function assert (val, msg) {
    if (!val) throw new Error(msg || 'Assertion failed');
  }

  // Could use `inherits` module, but don't want to move from single file
  // architecture yet.
  function inherits (ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  }

  // BN

  function BN (number, base, endian) {
    if (BN.isBN(number)) {
      return number;
    }

    this.negative = 0;
    this.words = null;
    this.length = 0;

    // Reduction context
    this.red = null;

    if (number !== null) {
      if (base === 'le' || base === 'be') {
        endian = base;
        base = 10;
      }

      this._init(number || 0, base || 10, endian || 'be');
    }
  }
  if (typeof module === 'object') {
    module.exports = BN;
  } else {
    exports.BN = BN;
  }

  BN.BN = BN;
  BN.wordSize = 26;

  var Buffer;
  try {
    if (typeof window !== 'undefined' && typeof window.Buffer !== 'undefined') {
      Buffer = window.Buffer;
    } else {
      Buffer = (__webpack_require__(/*! buffer */ "?8131").Buffer);
    }
  } catch (e) {
  }

  BN.isBN = function isBN (num) {
    if (num instanceof BN) {
      return true;
    }

    return num !== null && typeof num === 'object' &&
      num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
  };

  BN.max = function max (left, right) {
    if (left.cmp(right) > 0) return left;
    return right;
  };

  BN.min = function min (left, right) {
    if (left.cmp(right) < 0) return left;
    return right;
  };

  BN.prototype._init = function init (number, base, endian) {
    if (typeof number === 'number') {
      return this._initNumber(number, base, endian);
    }

    if (typeof number === 'object') {
      return this._initArray(number, base, endian);
    }

    if (base === 'hex') {
      base = 16;
    }
    assert(base === (base | 0) && base >= 2 && base <= 36);

    number = number.toString().replace(/\s+/g, '');
    var start = 0;
    if (number[0] === '-') {
      start++;
      this.negative = 1;
    }

    if (start < number.length) {
      if (base === 16) {
        this._parseHex(number, start, endian);
      } else {
        this._parseBase(number, base, start);
        if (endian === 'le') {
          this._initArray(this.toArray(), base, endian);
        }
      }
    }
  };

  BN.prototype._initNumber = function _initNumber (number, base, endian) {
    if (number < 0) {
      this.negative = 1;
      number = -number;
    }
    if (number < 0x4000000) {
      this.words = [number & 0x3ffffff];
      this.length = 1;
    } else if (number < 0x10000000000000) {
      this.words = [
        number & 0x3ffffff,
        (number / 0x4000000) & 0x3ffffff
      ];
      this.length = 2;
    } else {
      assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
      this.words = [
        number & 0x3ffffff,
        (number / 0x4000000) & 0x3ffffff,
        1
      ];
      this.length = 3;
    }

    if (endian !== 'le') return;

    // Reverse the bytes
    this._initArray(this.toArray(), base, endian);
  };

  BN.prototype._initArray = function _initArray (number, base, endian) {
    // Perhaps a Uint8Array
    assert(typeof number.length === 'number');
    if (number.length <= 0) {
      this.words = [0];
      this.length = 1;
      return this;
    }

    this.length = Math.ceil(number.length / 3);
    this.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      this.words[i] = 0;
    }

    var j, w;
    var off = 0;
    if (endian === 'be') {
      for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
        w = number[i] | (number[i - 1] << 8) | (number[i - 2] << 16);
        this.words[j] |= (w << off) & 0x3ffffff;
        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
        off += 24;
        if (off >= 26) {
          off -= 26;
          j++;
        }
      }
    } else if (endian === 'le') {
      for (i = 0, j = 0; i < number.length; i += 3) {
        w = number[i] | (number[i + 1] << 8) | (number[i + 2] << 16);
        this.words[j] |= (w << off) & 0x3ffffff;
        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
        off += 24;
        if (off >= 26) {
          off -= 26;
          j++;
        }
      }
    }
    return this._strip();
  };

  function parseHex4Bits (string, index) {
    var c = string.charCodeAt(index);
    // '0' - '9'
    if (c >= 48 && c <= 57) {
      return c - 48;
    // 'A' - 'F'
    } else if (c >= 65 && c <= 70) {
      return c - 55;
    // 'a' - 'f'
    } else if (c >= 97 && c <= 102) {
      return c - 87;
    } else {
      assert(false, 'Invalid character in ' + string);
    }
  }

  function parseHexByte (string, lowerBound, index) {
    var r = parseHex4Bits(string, index);
    if (index - 1 >= lowerBound) {
      r |= parseHex4Bits(string, index - 1) << 4;
    }
    return r;
  }

  BN.prototype._parseHex = function _parseHex (number, start, endian) {
    // Create possibly bigger array to ensure that it fits the number
    this.length = Math.ceil((number.length - start) / 6);
    this.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      this.words[i] = 0;
    }

    // 24-bits chunks
    var off = 0;
    var j = 0;

    var w;
    if (endian === 'be') {
      for (i = number.length - 1; i >= start; i -= 2) {
        w = parseHexByte(number, start, i) << off;
        this.words[j] |= w & 0x3ffffff;
        if (off >= 18) {
          off -= 18;
          j += 1;
          this.words[j] |= w >>> 26;
        } else {
          off += 8;
        }
      }
    } else {
      var parseLength = number.length - start;
      for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
        w = parseHexByte(number, start, i) << off;
        this.words[j] |= w & 0x3ffffff;
        if (off >= 18) {
          off -= 18;
          j += 1;
          this.words[j] |= w >>> 26;
        } else {
          off += 8;
        }
      }
    }

    this._strip();
  };

  function parseBase (str, start, end, mul) {
    var r = 0;
    var b = 0;
    var len = Math.min(str.length, end);
    for (var i = start; i < len; i++) {
      var c = str.charCodeAt(i) - 48;

      r *= mul;

      // 'a'
      if (c >= 49) {
        b = c - 49 + 0xa;

      // 'A'
      } else if (c >= 17) {
        b = c - 17 + 0xa;

      // '0' - '9'
      } else {
        b = c;
      }
      assert(c >= 0 && b < mul, 'Invalid character');
      r += b;
    }
    return r;
  }

  BN.prototype._parseBase = function _parseBase (number, base, start) {
    // Initialize as zero
    this.words = [0];
    this.length = 1;

    // Find length of limb in base
    for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
      limbLen++;
    }
    limbLen--;
    limbPow = (limbPow / base) | 0;

    var total = number.length - start;
    var mod = total % limbLen;
    var end = Math.min(total, total - mod) + start;

    var word = 0;
    for (var i = start; i < end; i += limbLen) {
      word = parseBase(number, i, i + limbLen, base);

      this.imuln(limbPow);
      if (this.words[0] + word < 0x4000000) {
        this.words[0] += word;
      } else {
        this._iaddn(word);
      }
    }

    if (mod !== 0) {
      var pow = 1;
      word = parseBase(number, i, number.length, base);

      for (i = 0; i < mod; i++) {
        pow *= base;
      }

      this.imuln(pow);
      if (this.words[0] + word < 0x4000000) {
        this.words[0] += word;
      } else {
        this._iaddn(word);
      }
    }

    this._strip();
  };

  BN.prototype.copy = function copy (dest) {
    dest.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      dest.words[i] = this.words[i];
    }
    dest.length = this.length;
    dest.negative = this.negative;
    dest.red = this.red;
  };

  function move (dest, src) {
    dest.words = src.words;
    dest.length = src.length;
    dest.negative = src.negative;
    dest.red = src.red;
  }

  BN.prototype._move = function _move (dest) {
    move(dest, this);
  };

  BN.prototype.clone = function clone () {
    var r = new BN(null);
    this.copy(r);
    return r;
  };

  BN.prototype._expand = function _expand (size) {
    while (this.length < size) {
      this.words[this.length++] = 0;
    }
    return this;
  };

  // Remove leading `0` from `this`
  BN.prototype._strip = function strip () {
    while (this.length > 1 && this.words[this.length - 1] === 0) {
      this.length--;
    }
    return this._normSign();
  };

  BN.prototype._normSign = function _normSign () {
    // -0 = 0
    if (this.length === 1 && this.words[0] === 0) {
      this.negative = 0;
    }
    return this;
  };

  // Check Symbol.for because not everywhere where Symbol defined
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#Browser_compatibility
  if (typeof Symbol !== 'undefined' && typeof Symbol.for === 'function') {
    try {
      BN.prototype[Symbol.for('nodejs.util.inspect.custom')] = inspect;
    } catch (e) {
      BN.prototype.inspect = inspect;
    }
  } else {
    BN.prototype.inspect = inspect;
  }

  function inspect () {
    return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
  }

  /*

  var zeros = [];
  var groupSizes = [];
  var groupBases = [];

  var s = '';
  var i = -1;
  while (++i < BN.wordSize) {
    zeros[i] = s;
    s += '0';
  }
  groupSizes[0] = 0;
  groupSizes[1] = 0;
  groupBases[0] = 0;
  groupBases[1] = 0;
  var base = 2 - 1;
  while (++base < 36 + 1) {
    var groupSize = 0;
    var groupBase = 1;
    while (groupBase < (1 << BN.wordSize) / base) {
      groupBase *= base;
      groupSize += 1;
    }
    groupSizes[base] = groupSize;
    groupBases[base] = groupBase;
  }

  */

  var zeros = [
    '',
    '0',
    '00',
    '000',
    '0000',
    '00000',
    '000000',
    '0000000',
    '00000000',
    '000000000',
    '0000000000',
    '00000000000',
    '000000000000',
    '0000000000000',
    '00000000000000',
    '000000000000000',
    '0000000000000000',
    '00000000000000000',
    '000000000000000000',
    '0000000000000000000',
    '00000000000000000000',
    '000000000000000000000',
    '0000000000000000000000',
    '00000000000000000000000',
    '000000000000000000000000',
    '0000000000000000000000000'
  ];

  var groupSizes = [
    0, 0,
    25, 16, 12, 11, 10, 9, 8,
    8, 7, 7, 7, 7, 6, 6,
    6, 6, 6, 6, 6, 5, 5,
    5, 5, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5
  ];

  var groupBases = [
    0, 0,
    33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216,
    43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625,
    16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632,
    6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149,
    24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176
  ];

  BN.prototype.toString = function toString (base, padding) {
    base = base || 10;
    padding = padding | 0 || 1;

    var out;
    if (base === 16 || base === 'hex') {
      out = '';
      var off = 0;
      var carry = 0;
      for (var i = 0; i < this.length; i++) {
        var w = this.words[i];
        var word = (((w << off) | carry) & 0xffffff).toString(16);
        carry = (w >>> (24 - off)) & 0xffffff;
        off += 2;
        if (off >= 26) {
          off -= 26;
          i--;
        }
        if (carry !== 0 || i !== this.length - 1) {
          out = zeros[6 - word.length] + word + out;
        } else {
          out = word + out;
        }
      }
      if (carry !== 0) {
        out = carry.toString(16) + out;
      }
      while (out.length % padding !== 0) {
        out = '0' + out;
      }
      if (this.negative !== 0) {
        out = '-' + out;
      }
      return out;
    }

    if (base === (base | 0) && base >= 2 && base <= 36) {
      // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
      var groupSize = groupSizes[base];
      // var groupBase = Math.pow(base, groupSize);
      var groupBase = groupBases[base];
      out = '';
      var c = this.clone();
      c.negative = 0;
      while (!c.isZero()) {
        var r = c.modrn(groupBase).toString(base);
        c = c.idivn(groupBase);

        if (!c.isZero()) {
          out = zeros[groupSize - r.length] + r + out;
        } else {
          out = r + out;
        }
      }
      if (this.isZero()) {
        out = '0' + out;
      }
      while (out.length % padding !== 0) {
        out = '0' + out;
      }
      if (this.negative !== 0) {
        out = '-' + out;
      }
      return out;
    }

    assert(false, 'Base should be between 2 and 36');
  };

  BN.prototype.toNumber = function toNumber () {
    var ret = this.words[0];
    if (this.length === 2) {
      ret += this.words[1] * 0x4000000;
    } else if (this.length === 3 && this.words[2] === 0x01) {
      // NOTE: at this stage it is known that the top bit is set
      ret += 0x10000000000000 + (this.words[1] * 0x4000000);
    } else if (this.length > 2) {
      assert(false, 'Number can only safely store up to 53 bits');
    }
    return (this.negative !== 0) ? -ret : ret;
  };

  BN.prototype.toJSON = function toJSON () {
    return this.toString(16, 2);
  };

  if (Buffer) {
    BN.prototype.toBuffer = function toBuffer (endian, length) {
      return this.toArrayLike(Buffer, endian, length);
    };
  }

  BN.prototype.toArray = function toArray (endian, length) {
    return this.toArrayLike(Array, endian, length);
  };

  var allocate = function allocate (ArrayType, size) {
    if (ArrayType.allocUnsafe) {
      return ArrayType.allocUnsafe(size);
    }
    return new ArrayType(size);
  };

  BN.prototype.toArrayLike = function toArrayLike (ArrayType, endian, length) {
    this._strip();

    var byteLength = this.byteLength();
    var reqLength = length || Math.max(1, byteLength);
    assert(byteLength <= reqLength, 'byte array longer than desired length');
    assert(reqLength > 0, 'Requested array length <= 0');

    var res = allocate(ArrayType, reqLength);
    var postfix = endian === 'le' ? 'LE' : 'BE';
    this['_toArrayLike' + postfix](res, byteLength);
    return res;
  };

  BN.prototype._toArrayLikeLE = function _toArrayLikeLE (res, byteLength) {
    var position = 0;
    var carry = 0;

    for (var i = 0, shift = 0; i < this.length; i++) {
      var word = (this.words[i] << shift) | carry;

      res[position++] = word & 0xff;
      if (position < res.length) {
        res[position++] = (word >> 8) & 0xff;
      }
      if (position < res.length) {
        res[position++] = (word >> 16) & 0xff;
      }

      if (shift === 6) {
        if (position < res.length) {
          res[position++] = (word >> 24) & 0xff;
        }
        carry = 0;
        shift = 0;
      } else {
        carry = word >>> 24;
        shift += 2;
      }
    }

    if (position < res.length) {
      res[position++] = carry;

      while (position < res.length) {
        res[position++] = 0;
      }
    }
  };

  BN.prototype._toArrayLikeBE = function _toArrayLikeBE (res, byteLength) {
    var position = res.length - 1;
    var carry = 0;

    for (var i = 0, shift = 0; i < this.length; i++) {
      var word = (this.words[i] << shift) | carry;

      res[position--] = word & 0xff;
      if (position >= 0) {
        res[position--] = (word >> 8) & 0xff;
      }
      if (position >= 0) {
        res[position--] = (word >> 16) & 0xff;
      }

      if (shift === 6) {
        if (position >= 0) {
          res[position--] = (word >> 24) & 0xff;
        }
        carry = 0;
        shift = 0;
      } else {
        carry = word >>> 24;
        shift += 2;
      }
    }

    if (position >= 0) {
      res[position--] = carry;

      while (position >= 0) {
        res[position--] = 0;
      }
    }
  };

  if (Math.clz32) {
    BN.prototype._countBits = function _countBits (w) {
      return 32 - Math.clz32(w);
    };
  } else {
    BN.prototype._countBits = function _countBits (w) {
      var t = w;
      var r = 0;
      if (t >= 0x1000) {
        r += 13;
        t >>>= 13;
      }
      if (t >= 0x40) {
        r += 7;
        t >>>= 7;
      }
      if (t >= 0x8) {
        r += 4;
        t >>>= 4;
      }
      if (t >= 0x02) {
        r += 2;
        t >>>= 2;
      }
      return r + t;
    };
  }

  BN.prototype._zeroBits = function _zeroBits (w) {
    // Short-cut
    if (w === 0) return 26;

    var t = w;
    var r = 0;
    if ((t & 0x1fff) === 0) {
      r += 13;
      t >>>= 13;
    }
    if ((t & 0x7f) === 0) {
      r += 7;
      t >>>= 7;
    }
    if ((t & 0xf) === 0) {
      r += 4;
      t >>>= 4;
    }
    if ((t & 0x3) === 0) {
      r += 2;
      t >>>= 2;
    }
    if ((t & 0x1) === 0) {
      r++;
    }
    return r;
  };

  // Return number of used bits in a BN
  BN.prototype.bitLength = function bitLength () {
    var w = this.words[this.length - 1];
    var hi = this._countBits(w);
    return (this.length - 1) * 26 + hi;
  };

  function toBitArray (num) {
    var w = new Array(num.bitLength());

    for (var bit = 0; bit < w.length; bit++) {
      var off = (bit / 26) | 0;
      var wbit = bit % 26;

      w[bit] = (num.words[off] >>> wbit) & 0x01;
    }

    return w;
  }

  // Number of trailing zero bits
  BN.prototype.zeroBits = function zeroBits () {
    if (this.isZero()) return 0;

    var r = 0;
    for (var i = 0; i < this.length; i++) {
      var b = this._zeroBits(this.words[i]);
      r += b;
      if (b !== 26) break;
    }
    return r;
  };

  BN.prototype.byteLength = function byteLength () {
    return Math.ceil(this.bitLength() / 8);
  };

  BN.prototype.toTwos = function toTwos (width) {
    if (this.negative !== 0) {
      return this.abs().inotn(width).iaddn(1);
    }
    return this.clone();
  };

  BN.prototype.fromTwos = function fromTwos (width) {
    if (this.testn(width - 1)) {
      return this.notn(width).iaddn(1).ineg();
    }
    return this.clone();
  };

  BN.prototype.isNeg = function isNeg () {
    return this.negative !== 0;
  };

  // Return negative clone of `this`
  BN.prototype.neg = function neg () {
    return this.clone().ineg();
  };

  BN.prototype.ineg = function ineg () {
    if (!this.isZero()) {
      this.negative ^= 1;
    }

    return this;
  };

  // Or `num` with `this` in-place
  BN.prototype.iuor = function iuor (num) {
    while (this.length < num.length) {
      this.words[this.length++] = 0;
    }

    for (var i = 0; i < num.length; i++) {
      this.words[i] = this.words[i] | num.words[i];
    }

    return this._strip();
  };

  BN.prototype.ior = function ior (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuor(num);
  };

  // Or `num` with `this`
  BN.prototype.or = function or (num) {
    if (this.length > num.length) return this.clone().ior(num);
    return num.clone().ior(this);
  };

  BN.prototype.uor = function uor (num) {
    if (this.length > num.length) return this.clone().iuor(num);
    return num.clone().iuor(this);
  };

  // And `num` with `this` in-place
  BN.prototype.iuand = function iuand (num) {
    // b = min-length(num, this)
    var b;
    if (this.length > num.length) {
      b = num;
    } else {
      b = this;
    }

    for (var i = 0; i < b.length; i++) {
      this.words[i] = this.words[i] & num.words[i];
    }

    this.length = b.length;

    return this._strip();
  };

  BN.prototype.iand = function iand (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuand(num);
  };

  // And `num` with `this`
  BN.prototype.and = function and (num) {
    if (this.length > num.length) return this.clone().iand(num);
    return num.clone().iand(this);
  };

  BN.prototype.uand = function uand (num) {
    if (this.length > num.length) return this.clone().iuand(num);
    return num.clone().iuand(this);
  };

  // Xor `num` with `this` in-place
  BN.prototype.iuxor = function iuxor (num) {
    // a.length > b.length
    var a;
    var b;
    if (this.length > num.length) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    for (var i = 0; i < b.length; i++) {
      this.words[i] = a.words[i] ^ b.words[i];
    }

    if (this !== a) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    this.length = a.length;

    return this._strip();
  };

  BN.prototype.ixor = function ixor (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuxor(num);
  };

  // Xor `num` with `this`
  BN.prototype.xor = function xor (num) {
    if (this.length > num.length) return this.clone().ixor(num);
    return num.clone().ixor(this);
  };

  BN.prototype.uxor = function uxor (num) {
    if (this.length > num.length) return this.clone().iuxor(num);
    return num.clone().iuxor(this);
  };

  // Not ``this`` with ``width`` bitwidth
  BN.prototype.inotn = function inotn (width) {
    assert(typeof width === 'number' && width >= 0);

    var bytesNeeded = Math.ceil(width / 26) | 0;
    var bitsLeft = width % 26;

    // Extend the buffer with leading zeroes
    this._expand(bytesNeeded);

    if (bitsLeft > 0) {
      bytesNeeded--;
    }

    // Handle complete words
    for (var i = 0; i < bytesNeeded; i++) {
      this.words[i] = ~this.words[i] & 0x3ffffff;
    }

    // Handle the residue
    if (bitsLeft > 0) {
      this.words[i] = ~this.words[i] & (0x3ffffff >> (26 - bitsLeft));
    }

    // And remove leading zeroes
    return this._strip();
  };

  BN.prototype.notn = function notn (width) {
    return this.clone().inotn(width);
  };

  // Set `bit` of `this`
  BN.prototype.setn = function setn (bit, val) {
    assert(typeof bit === 'number' && bit >= 0);

    var off = (bit / 26) | 0;
    var wbit = bit % 26;

    this._expand(off + 1);

    if (val) {
      this.words[off] = this.words[off] | (1 << wbit);
    } else {
      this.words[off] = this.words[off] & ~(1 << wbit);
    }

    return this._strip();
  };

  // Add `num` to `this` in-place
  BN.prototype.iadd = function iadd (num) {
    var r;

    // negative + positive
    if (this.negative !== 0 && num.negative === 0) {
      this.negative = 0;
      r = this.isub(num);
      this.negative ^= 1;
      return this._normSign();

    // positive + negative
    } else if (this.negative === 0 && num.negative !== 0) {
      num.negative = 0;
      r = this.isub(num);
      num.negative = 1;
      return r._normSign();
    }

    // a.length > b.length
    var a, b;
    if (this.length > num.length) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    var carry = 0;
    for (var i = 0; i < b.length; i++) {
      r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
      this.words[i] = r & 0x3ffffff;
      carry = r >>> 26;
    }
    for (; carry !== 0 && i < a.length; i++) {
      r = (a.words[i] | 0) + carry;
      this.words[i] = r & 0x3ffffff;
      carry = r >>> 26;
    }

    this.length = a.length;
    if (carry !== 0) {
      this.words[this.length] = carry;
      this.length++;
    // Copy the rest of the words
    } else if (a !== this) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    return this;
  };

  // Add `num` to `this`
  BN.prototype.add = function add (num) {
    var res;
    if (num.negative !== 0 && this.negative === 0) {
      num.negative = 0;
      res = this.sub(num);
      num.negative ^= 1;
      return res;
    } else if (num.negative === 0 && this.negative !== 0) {
      this.negative = 0;
      res = num.sub(this);
      this.negative = 1;
      return res;
    }

    if (this.length > num.length) return this.clone().iadd(num);

    return num.clone().iadd(this);
  };

  // Subtract `num` from `this` in-place
  BN.prototype.isub = function isub (num) {
    // this - (-num) = this + num
    if (num.negative !== 0) {
      num.negative = 0;
      var r = this.iadd(num);
      num.negative = 1;
      return r._normSign();

    // -this - num = -(this + num)
    } else if (this.negative !== 0) {
      this.negative = 0;
      this.iadd(num);
      this.negative = 1;
      return this._normSign();
    }

    // At this point both numbers are positive
    var cmp = this.cmp(num);

    // Optimization - zeroify
    if (cmp === 0) {
      this.negative = 0;
      this.length = 1;
      this.words[0] = 0;
      return this;
    }

    // a > b
    var a, b;
    if (cmp > 0) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    var carry = 0;
    for (var i = 0; i < b.length; i++) {
      r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
      carry = r >> 26;
      this.words[i] = r & 0x3ffffff;
    }
    for (; carry !== 0 && i < a.length; i++) {
      r = (a.words[i] | 0) + carry;
      carry = r >> 26;
      this.words[i] = r & 0x3ffffff;
    }

    // Copy rest of the words
    if (carry === 0 && i < a.length && a !== this) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    this.length = Math.max(this.length, i);

    if (a !== this) {
      this.negative = 1;
    }

    return this._strip();
  };

  // Subtract `num` from `this`
  BN.prototype.sub = function sub (num) {
    return this.clone().isub(num);
  };

  function smallMulTo (self, num, out) {
    out.negative = num.negative ^ self.negative;
    var len = (self.length + num.length) | 0;
    out.length = len;
    len = (len - 1) | 0;

    // Peel one iteration (compiler can't do it, because of code complexity)
    var a = self.words[0] | 0;
    var b = num.words[0] | 0;
    var r = a * b;

    var lo = r & 0x3ffffff;
    var carry = (r / 0x4000000) | 0;
    out.words[0] = lo;

    for (var k = 1; k < len; k++) {
      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
      // note that ncarry could be >= 0x3ffffff
      var ncarry = carry >>> 26;
      var rword = carry & 0x3ffffff;
      var maxJ = Math.min(k, num.length - 1);
      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
        var i = (k - j) | 0;
        a = self.words[i] | 0;
        b = num.words[j] | 0;
        r = a * b + rword;
        ncarry += (r / 0x4000000) | 0;
        rword = r & 0x3ffffff;
      }
      out.words[k] = rword | 0;
      carry = ncarry | 0;
    }
    if (carry !== 0) {
      out.words[k] = carry | 0;
    } else {
      out.length--;
    }

    return out._strip();
  }

  // TODO(indutny): it may be reasonable to omit it for users who don't need
  // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
  // multiplication (like elliptic secp256k1).
  var comb10MulTo = function comb10MulTo (self, num, out) {
    var a = self.words;
    var b = num.words;
    var o = out.words;
    var c = 0;
    var lo;
    var mid;
    var hi;
    var a0 = a[0] | 0;
    var al0 = a0 & 0x1fff;
    var ah0 = a0 >>> 13;
    var a1 = a[1] | 0;
    var al1 = a1 & 0x1fff;
    var ah1 = a1 >>> 13;
    var a2 = a[2] | 0;
    var al2 = a2 & 0x1fff;
    var ah2 = a2 >>> 13;
    var a3 = a[3] | 0;
    var al3 = a3 & 0x1fff;
    var ah3 = a3 >>> 13;
    var a4 = a[4] | 0;
    var al4 = a4 & 0x1fff;
    var ah4 = a4 >>> 13;
    var a5 = a[5] | 0;
    var al5 = a5 & 0x1fff;
    var ah5 = a5 >>> 13;
    var a6 = a[6] | 0;
    var al6 = a6 & 0x1fff;
    var ah6 = a6 >>> 13;
    var a7 = a[7] | 0;
    var al7 = a7 & 0x1fff;
    var ah7 = a7 >>> 13;
    var a8 = a[8] | 0;
    var al8 = a8 & 0x1fff;
    var ah8 = a8 >>> 13;
    var a9 = a[9] | 0;
    var al9 = a9 & 0x1fff;
    var ah9 = a9 >>> 13;
    var b0 = b[0] | 0;
    var bl0 = b0 & 0x1fff;
    var bh0 = b0 >>> 13;
    var b1 = b[1] | 0;
    var bl1 = b1 & 0x1fff;
    var bh1 = b1 >>> 13;
    var b2 = b[2] | 0;
    var bl2 = b2 & 0x1fff;
    var bh2 = b2 >>> 13;
    var b3 = b[3] | 0;
    var bl3 = b3 & 0x1fff;
    var bh3 = b3 >>> 13;
    var b4 = b[4] | 0;
    var bl4 = b4 & 0x1fff;
    var bh4 = b4 >>> 13;
    var b5 = b[5] | 0;
    var bl5 = b5 & 0x1fff;
    var bh5 = b5 >>> 13;
    var b6 = b[6] | 0;
    var bl6 = b6 & 0x1fff;
    var bh6 = b6 >>> 13;
    var b7 = b[7] | 0;
    var bl7 = b7 & 0x1fff;
    var bh7 = b7 >>> 13;
    var b8 = b[8] | 0;
    var bl8 = b8 & 0x1fff;
    var bh8 = b8 >>> 13;
    var b9 = b[9] | 0;
    var bl9 = b9 & 0x1fff;
    var bh9 = b9 >>> 13;

    out.negative = self.negative ^ num.negative;
    out.length = 19;
    /* k = 0 */
    lo = Math.imul(al0, bl0);
    mid = Math.imul(al0, bh0);
    mid = (mid + Math.imul(ah0, bl0)) | 0;
    hi = Math.imul(ah0, bh0);
    var w0 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w0 >>> 26)) | 0;
    w0 &= 0x3ffffff;
    /* k = 1 */
    lo = Math.imul(al1, bl0);
    mid = Math.imul(al1, bh0);
    mid = (mid + Math.imul(ah1, bl0)) | 0;
    hi = Math.imul(ah1, bh0);
    lo = (lo + Math.imul(al0, bl1)) | 0;
    mid = (mid + Math.imul(al0, bh1)) | 0;
    mid = (mid + Math.imul(ah0, bl1)) | 0;
    hi = (hi + Math.imul(ah0, bh1)) | 0;
    var w1 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w1 >>> 26)) | 0;
    w1 &= 0x3ffffff;
    /* k = 2 */
    lo = Math.imul(al2, bl0);
    mid = Math.imul(al2, bh0);
    mid = (mid + Math.imul(ah2, bl0)) | 0;
    hi = Math.imul(ah2, bh0);
    lo = (lo + Math.imul(al1, bl1)) | 0;
    mid = (mid + Math.imul(al1, bh1)) | 0;
    mid = (mid + Math.imul(ah1, bl1)) | 0;
    hi = (hi + Math.imul(ah1, bh1)) | 0;
    lo = (lo + Math.imul(al0, bl2)) | 0;
    mid = (mid + Math.imul(al0, bh2)) | 0;
    mid = (mid + Math.imul(ah0, bl2)) | 0;
    hi = (hi + Math.imul(ah0, bh2)) | 0;
    var w2 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w2 >>> 26)) | 0;
    w2 &= 0x3ffffff;
    /* k = 3 */
    lo = Math.imul(al3, bl0);
    mid = Math.imul(al3, bh0);
    mid = (mid + Math.imul(ah3, bl0)) | 0;
    hi = Math.imul(ah3, bh0);
    lo = (lo + Math.imul(al2, bl1)) | 0;
    mid = (mid + Math.imul(al2, bh1)) | 0;
    mid = (mid + Math.imul(ah2, bl1)) | 0;
    hi = (hi + Math.imul(ah2, bh1)) | 0;
    lo = (lo + Math.imul(al1, bl2)) | 0;
    mid = (mid + Math.imul(al1, bh2)) | 0;
    mid = (mid + Math.imul(ah1, bl2)) | 0;
    hi = (hi + Math.imul(ah1, bh2)) | 0;
    lo = (lo + Math.imul(al0, bl3)) | 0;
    mid = (mid + Math.imul(al0, bh3)) | 0;
    mid = (mid + Math.imul(ah0, bl3)) | 0;
    hi = (hi + Math.imul(ah0, bh3)) | 0;
    var w3 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w3 >>> 26)) | 0;
    w3 &= 0x3ffffff;
    /* k = 4 */
    lo = Math.imul(al4, bl0);
    mid = Math.imul(al4, bh0);
    mid = (mid + Math.imul(ah4, bl0)) | 0;
    hi = Math.imul(ah4, bh0);
    lo = (lo + Math.imul(al3, bl1)) | 0;
    mid = (mid + Math.imul(al3, bh1)) | 0;
    mid = (mid + Math.imul(ah3, bl1)) | 0;
    hi = (hi + Math.imul(ah3, bh1)) | 0;
    lo = (lo + Math.imul(al2, bl2)) | 0;
    mid = (mid + Math.imul(al2, bh2)) | 0;
    mid = (mid + Math.imul(ah2, bl2)) | 0;
    hi = (hi + Math.imul(ah2, bh2)) | 0;
    lo = (lo + Math.imul(al1, bl3)) | 0;
    mid = (mid + Math.imul(al1, bh3)) | 0;
    mid = (mid + Math.imul(ah1, bl3)) | 0;
    hi = (hi + Math.imul(ah1, bh3)) | 0;
    lo = (lo + Math.imul(al0, bl4)) | 0;
    mid = (mid + Math.imul(al0, bh4)) | 0;
    mid = (mid + Math.imul(ah0, bl4)) | 0;
    hi = (hi + Math.imul(ah0, bh4)) | 0;
    var w4 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w4 >>> 26)) | 0;
    w4 &= 0x3ffffff;
    /* k = 5 */
    lo = Math.imul(al5, bl0);
    mid = Math.imul(al5, bh0);
    mid = (mid + Math.imul(ah5, bl0)) | 0;
    hi = Math.imul(ah5, bh0);
    lo = (lo + Math.imul(al4, bl1)) | 0;
    mid = (mid + Math.imul(al4, bh1)) | 0;
    mid = (mid + Math.imul(ah4, bl1)) | 0;
    hi = (hi + Math.imul(ah4, bh1)) | 0;
    lo = (lo + Math.imul(al3, bl2)) | 0;
    mid = (mid + Math.imul(al3, bh2)) | 0;
    mid = (mid + Math.imul(ah3, bl2)) | 0;
    hi = (hi + Math.imul(ah3, bh2)) | 0;
    lo = (lo + Math.imul(al2, bl3)) | 0;
    mid = (mid + Math.imul(al2, bh3)) | 0;
    mid = (mid + Math.imul(ah2, bl3)) | 0;
    hi = (hi + Math.imul(ah2, bh3)) | 0;
    lo = (lo + Math.imul(al1, bl4)) | 0;
    mid = (mid + Math.imul(al1, bh4)) | 0;
    mid = (mid + Math.imul(ah1, bl4)) | 0;
    hi = (hi + Math.imul(ah1, bh4)) | 0;
    lo = (lo + Math.imul(al0, bl5)) | 0;
    mid = (mid + Math.imul(al0, bh5)) | 0;
    mid = (mid + Math.imul(ah0, bl5)) | 0;
    hi = (hi + Math.imul(ah0, bh5)) | 0;
    var w5 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w5 >>> 26)) | 0;
    w5 &= 0x3ffffff;
    /* k = 6 */
    lo = Math.imul(al6, bl0);
    mid = Math.imul(al6, bh0);
    mid = (mid + Math.imul(ah6, bl0)) | 0;
    hi = Math.imul(ah6, bh0);
    lo = (lo + Math.imul(al5, bl1)) | 0;
    mid = (mid + Math.imul(al5, bh1)) | 0;
    mid = (mid + Math.imul(ah5, bl1)) | 0;
    hi = (hi + Math.imul(ah5, bh1)) | 0;
    lo = (lo + Math.imul(al4, bl2)) | 0;
    mid = (mid + Math.imul(al4, bh2)) | 0;
    mid = (mid + Math.imul(ah4, bl2)) | 0;
    hi = (hi + Math.imul(ah4, bh2)) | 0;
    lo = (lo + Math.imul(al3, bl3)) | 0;
    mid = (mid + Math.imul(al3, bh3)) | 0;
    mid = (mid + Math.imul(ah3, bl3)) | 0;
    hi = (hi + Math.imul(ah3, bh3)) | 0;
    lo = (lo + Math.imul(al2, bl4)) | 0;
    mid = (mid + Math.imul(al2, bh4)) | 0;
    mid = (mid + Math.imul(ah2, bl4)) | 0;
    hi = (hi + Math.imul(ah2, bh4)) | 0;
    lo = (lo + Math.imul(al1, bl5)) | 0;
    mid = (mid + Math.imul(al1, bh5)) | 0;
    mid = (mid + Math.imul(ah1, bl5)) | 0;
    hi = (hi + Math.imul(ah1, bh5)) | 0;
    lo = (lo + Math.imul(al0, bl6)) | 0;
    mid = (mid + Math.imul(al0, bh6)) | 0;
    mid = (mid + Math.imul(ah0, bl6)) | 0;
    hi = (hi + Math.imul(ah0, bh6)) | 0;
    var w6 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w6 >>> 26)) | 0;
    w6 &= 0x3ffffff;
    /* k = 7 */
    lo = Math.imul(al7, bl0);
    mid = Math.imul(al7, bh0);
    mid = (mid + Math.imul(ah7, bl0)) | 0;
    hi = Math.imul(ah7, bh0);
    lo = (lo + Math.imul(al6, bl1)) | 0;
    mid = (mid + Math.imul(al6, bh1)) | 0;
    mid = (mid + Math.imul(ah6, bl1)) | 0;
    hi = (hi + Math.imul(ah6, bh1)) | 0;
    lo = (lo + Math.imul(al5, bl2)) | 0;
    mid = (mid + Math.imul(al5, bh2)) | 0;
    mid = (mid + Math.imul(ah5, bl2)) | 0;
    hi = (hi + Math.imul(ah5, bh2)) | 0;
    lo = (lo + Math.imul(al4, bl3)) | 0;
    mid = (mid + Math.imul(al4, bh3)) | 0;
    mid = (mid + Math.imul(ah4, bl3)) | 0;
    hi = (hi + Math.imul(ah4, bh3)) | 0;
    lo = (lo + Math.imul(al3, bl4)) | 0;
    mid = (mid + Math.imul(al3, bh4)) | 0;
    mid = (mid + Math.imul(ah3, bl4)) | 0;
    hi = (hi + Math.imul(ah3, bh4)) | 0;
    lo = (lo + Math.imul(al2, bl5)) | 0;
    mid = (mid + Math.imul(al2, bh5)) | 0;
    mid = (mid + Math.imul(ah2, bl5)) | 0;
    hi = (hi + Math.imul(ah2, bh5)) | 0;
    lo = (lo + Math.imul(al1, bl6)) | 0;
    mid = (mid + Math.imul(al1, bh6)) | 0;
    mid = (mid + Math.imul(ah1, bl6)) | 0;
    hi = (hi + Math.imul(ah1, bh6)) | 0;
    lo = (lo + Math.imul(al0, bl7)) | 0;
    mid = (mid + Math.imul(al0, bh7)) | 0;
    mid = (mid + Math.imul(ah0, bl7)) | 0;
    hi = (hi + Math.imul(ah0, bh7)) | 0;
    var w7 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w7 >>> 26)) | 0;
    w7 &= 0x3ffffff;
    /* k = 8 */
    lo = Math.imul(al8, bl0);
    mid = Math.imul(al8, bh0);
    mid = (mid + Math.imul(ah8, bl0)) | 0;
    hi = Math.imul(ah8, bh0);
    lo = (lo + Math.imul(al7, bl1)) | 0;
    mid = (mid + Math.imul(al7, bh1)) | 0;
    mid = (mid + Math.imul(ah7, bl1)) | 0;
    hi = (hi + Math.imul(ah7, bh1)) | 0;
    lo = (lo + Math.imul(al6, bl2)) | 0;
    mid = (mid + Math.imul(al6, bh2)) | 0;
    mid = (mid + Math.imul(ah6, bl2)) | 0;
    hi = (hi + Math.imul(ah6, bh2)) | 0;
    lo = (lo + Math.imul(al5, bl3)) | 0;
    mid = (mid + Math.imul(al5, bh3)) | 0;
    mid = (mid + Math.imul(ah5, bl3)) | 0;
    hi = (hi + Math.imul(ah5, bh3)) | 0;
    lo = (lo + Math.imul(al4, bl4)) | 0;
    mid = (mid + Math.imul(al4, bh4)) | 0;
    mid = (mid + Math.imul(ah4, bl4)) | 0;
    hi = (hi + Math.imul(ah4, bh4)) | 0;
    lo = (lo + Math.imul(al3, bl5)) | 0;
    mid = (mid + Math.imul(al3, bh5)) | 0;
    mid = (mid + Math.imul(ah3, bl5)) | 0;
    hi = (hi + Math.imul(ah3, bh5)) | 0;
    lo = (lo + Math.imul(al2, bl6)) | 0;
    mid = (mid + Math.imul(al2, bh6)) | 0;
    mid = (mid + Math.imul(ah2, bl6)) | 0;
    hi = (hi + Math.imul(ah2, bh6)) | 0;
    lo = (lo + Math.imul(al1, bl7)) | 0;
    mid = (mid + Math.imul(al1, bh7)) | 0;
    mid = (mid + Math.imul(ah1, bl7)) | 0;
    hi = (hi + Math.imul(ah1, bh7)) | 0;
    lo = (lo + Math.imul(al0, bl8)) | 0;
    mid = (mid + Math.imul(al0, bh8)) | 0;
    mid = (mid + Math.imul(ah0, bl8)) | 0;
    hi = (hi + Math.imul(ah0, bh8)) | 0;
    var w8 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w8 >>> 26)) | 0;
    w8 &= 0x3ffffff;
    /* k = 9 */
    lo = Math.imul(al9, bl0);
    mid = Math.imul(al9, bh0);
    mid = (mid + Math.imul(ah9, bl0)) | 0;
    hi = Math.imul(ah9, bh0);
    lo = (lo + Math.imul(al8, bl1)) | 0;
    mid = (mid + Math.imul(al8, bh1)) | 0;
    mid = (mid + Math.imul(ah8, bl1)) | 0;
    hi = (hi + Math.imul(ah8, bh1)) | 0;
    lo = (lo + Math.imul(al7, bl2)) | 0;
    mid = (mid + Math.imul(al7, bh2)) | 0;
    mid = (mid + Math.imul(ah7, bl2)) | 0;
    hi = (hi + Math.imul(ah7, bh2)) | 0;
    lo = (lo + Math.imul(al6, bl3)) | 0;
    mid = (mid + Math.imul(al6, bh3)) | 0;
    mid = (mid + Math.imul(ah6, bl3)) | 0;
    hi = (hi + Math.imul(ah6, bh3)) | 0;
    lo = (lo + Math.imul(al5, bl4)) | 0;
    mid = (mid + Math.imul(al5, bh4)) | 0;
    mid = (mid + Math.imul(ah5, bl4)) | 0;
    hi = (hi + Math.imul(ah5, bh4)) | 0;
    lo = (lo + Math.imul(al4, bl5)) | 0;
    mid = (mid + Math.imul(al4, bh5)) | 0;
    mid = (mid + Math.imul(ah4, bl5)) | 0;
    hi = (hi + Math.imul(ah4, bh5)) | 0;
    lo = (lo + Math.imul(al3, bl6)) | 0;
    mid = (mid + Math.imul(al3, bh6)) | 0;
    mid = (mid + Math.imul(ah3, bl6)) | 0;
    hi = (hi + Math.imul(ah3, bh6)) | 0;
    lo = (lo + Math.imul(al2, bl7)) | 0;
    mid = (mid + Math.imul(al2, bh7)) | 0;
    mid = (mid + Math.imul(ah2, bl7)) | 0;
    hi = (hi + Math.imul(ah2, bh7)) | 0;
    lo = (lo + Math.imul(al1, bl8)) | 0;
    mid = (mid + Math.imul(al1, bh8)) | 0;
    mid = (mid + Math.imul(ah1, bl8)) | 0;
    hi = (hi + Math.imul(ah1, bh8)) | 0;
    lo = (lo + Math.imul(al0, bl9)) | 0;
    mid = (mid + Math.imul(al0, bh9)) | 0;
    mid = (mid + Math.imul(ah0, bl9)) | 0;
    hi = (hi + Math.imul(ah0, bh9)) | 0;
    var w9 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w9 >>> 26)) | 0;
    w9 &= 0x3ffffff;
    /* k = 10 */
    lo = Math.imul(al9, bl1);
    mid = Math.imul(al9, bh1);
    mid = (mid + Math.imul(ah9, bl1)) | 0;
    hi = Math.imul(ah9, bh1);
    lo = (lo + Math.imul(al8, bl2)) | 0;
    mid = (mid + Math.imul(al8, bh2)) | 0;
    mid = (mid + Math.imul(ah8, bl2)) | 0;
    hi = (hi + Math.imul(ah8, bh2)) | 0;
    lo = (lo + Math.imul(al7, bl3)) | 0;
    mid = (mid + Math.imul(al7, bh3)) | 0;
    mid = (mid + Math.imul(ah7, bl3)) | 0;
    hi = (hi + Math.imul(ah7, bh3)) | 0;
    lo = (lo + Math.imul(al6, bl4)) | 0;
    mid = (mid + Math.imul(al6, bh4)) | 0;
    mid = (mid + Math.imul(ah6, bl4)) | 0;
    hi = (hi + Math.imul(ah6, bh4)) | 0;
    lo = (lo + Math.imul(al5, bl5)) | 0;
    mid = (mid + Math.imul(al5, bh5)) | 0;
    mid = (mid + Math.imul(ah5, bl5)) | 0;
    hi = (hi + Math.imul(ah5, bh5)) | 0;
    lo = (lo + Math.imul(al4, bl6)) | 0;
    mid = (mid + Math.imul(al4, bh6)) | 0;
    mid = (mid + Math.imul(ah4, bl6)) | 0;
    hi = (hi + Math.imul(ah4, bh6)) | 0;
    lo = (lo + Math.imul(al3, bl7)) | 0;
    mid = (mid + Math.imul(al3, bh7)) | 0;
    mid = (mid + Math.imul(ah3, bl7)) | 0;
    hi = (hi + Math.imul(ah3, bh7)) | 0;
    lo = (lo + Math.imul(al2, bl8)) | 0;
    mid = (mid + Math.imul(al2, bh8)) | 0;
    mid = (mid + Math.imul(ah2, bl8)) | 0;
    hi = (hi + Math.imul(ah2, bh8)) | 0;
    lo = (lo + Math.imul(al1, bl9)) | 0;
    mid = (mid + Math.imul(al1, bh9)) | 0;
    mid = (mid + Math.imul(ah1, bl9)) | 0;
    hi = (hi + Math.imul(ah1, bh9)) | 0;
    var w10 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w10 >>> 26)) | 0;
    w10 &= 0x3ffffff;
    /* k = 11 */
    lo = Math.imul(al9, bl2);
    mid = Math.imul(al9, bh2);
    mid = (mid + Math.imul(ah9, bl2)) | 0;
    hi = Math.imul(ah9, bh2);
    lo = (lo + Math.imul(al8, bl3)) | 0;
    mid = (mid + Math.imul(al8, bh3)) | 0;
    mid = (mid + Math.imul(ah8, bl3)) | 0;
    hi = (hi + Math.imul(ah8, bh3)) | 0;
    lo = (lo + Math.imul(al7, bl4)) | 0;
    mid = (mid + Math.imul(al7, bh4)) | 0;
    mid = (mid + Math.imul(ah7, bl4)) | 0;
    hi = (hi + Math.imul(ah7, bh4)) | 0;
    lo = (lo + Math.imul(al6, bl5)) | 0;
    mid = (mid + Math.imul(al6, bh5)) | 0;
    mid = (mid + Math.imul(ah6, bl5)) | 0;
    hi = (hi + Math.imul(ah6, bh5)) | 0;
    lo = (lo + Math.imul(al5, bl6)) | 0;
    mid = (mid + Math.imul(al5, bh6)) | 0;
    mid = (mid + Math.imul(ah5, bl6)) | 0;
    hi = (hi + Math.imul(ah5, bh6)) | 0;
    lo = (lo + Math.imul(al4, bl7)) | 0;
    mid = (mid + Math.imul(al4, bh7)) | 0;
    mid = (mid + Math.imul(ah4, bl7)) | 0;
    hi = (hi + Math.imul(ah4, bh7)) | 0;
    lo = (lo + Math.imul(al3, bl8)) | 0;
    mid = (mid + Math.imul(al3, bh8)) | 0;
    mid = (mid + Math.imul(ah3, bl8)) | 0;
    hi = (hi + Math.imul(ah3, bh8)) | 0;
    lo = (lo + Math.imul(al2, bl9)) | 0;
    mid = (mid + Math.imul(al2, bh9)) | 0;
    mid = (mid + Math.imul(ah2, bl9)) | 0;
    hi = (hi + Math.imul(ah2, bh9)) | 0;
    var w11 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w11 >>> 26)) | 0;
    w11 &= 0x3ffffff;
    /* k = 12 */
    lo = Math.imul(al9, bl3);
    mid = Math.imul(al9, bh3);
    mid = (mid + Math.imul(ah9, bl3)) | 0;
    hi = Math.imul(ah9, bh3);
    lo = (lo + Math.imul(al8, bl4)) | 0;
    mid = (mid + Math.imul(al8, bh4)) | 0;
    mid = (mid + Math.imul(ah8, bl4)) | 0;
    hi = (hi + Math.imul(ah8, bh4)) | 0;
    lo = (lo + Math.imul(al7, bl5)) | 0;
    mid = (mid + Math.imul(al7, bh5)) | 0;
    mid = (mid + Math.imul(ah7, bl5)) | 0;
    hi = (hi + Math.imul(ah7, bh5)) | 0;
    lo = (lo + Math.imul(al6, bl6)) | 0;
    mid = (mid + Math.imul(al6, bh6)) | 0;
    mid = (mid + Math.imul(ah6, bl6)) | 0;
    hi = (hi + Math.imul(ah6, bh6)) | 0;
    lo = (lo + Math.imul(al5, bl7)) | 0;
    mid = (mid + Math.imul(al5, bh7)) | 0;
    mid = (mid + Math.imul(ah5, bl7)) | 0;
    hi = (hi + Math.imul(ah5, bh7)) | 0;
    lo = (lo + Math.imul(al4, bl8)) | 0;
    mid = (mid + Math.imul(al4, bh8)) | 0;
    mid = (mid + Math.imul(ah4, bl8)) | 0;
    hi = (hi + Math.imul(ah4, bh8)) | 0;
    lo = (lo + Math.imul(al3, bl9)) | 0;
    mid = (mid + Math.imul(al3, bh9)) | 0;
    mid = (mid + Math.imul(ah3, bl9)) | 0;
    hi = (hi + Math.imul(ah3, bh9)) | 0;
    var w12 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w12 >>> 26)) | 0;
    w12 &= 0x3ffffff;
    /* k = 13 */
    lo = Math.imul(al9, bl4);
    mid = Math.imul(al9, bh4);
    mid = (mid + Math.imul(ah9, bl4)) | 0;
    hi = Math.imul(ah9, bh4);
    lo = (lo + Math.imul(al8, bl5)) | 0;
    mid = (mid + Math.imul(al8, bh5)) | 0;
    mid = (mid + Math.imul(ah8, bl5)) | 0;
    hi = (hi + Math.imul(ah8, bh5)) | 0;
    lo = (lo + Math.imul(al7, bl6)) | 0;
    mid = (mid + Math.imul(al7, bh6)) | 0;
    mid = (mid + Math.imul(ah7, bl6)) | 0;
    hi = (hi + Math.imul(ah7, bh6)) | 0;
    lo = (lo + Math.imul(al6, bl7)) | 0;
    mid = (mid + Math.imul(al6, bh7)) | 0;
    mid = (mid + Math.imul(ah6, bl7)) | 0;
    hi = (hi + Math.imul(ah6, bh7)) | 0;
    lo = (lo + Math.imul(al5, bl8)) | 0;
    mid = (mid + Math.imul(al5, bh8)) | 0;
    mid = (mid + Math.imul(ah5, bl8)) | 0;
    hi = (hi + Math.imul(ah5, bh8)) | 0;
    lo = (lo + Math.imul(al4, bl9)) | 0;
    mid = (mid + Math.imul(al4, bh9)) | 0;
    mid = (mid + Math.imul(ah4, bl9)) | 0;
    hi = (hi + Math.imul(ah4, bh9)) | 0;
    var w13 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w13 >>> 26)) | 0;
    w13 &= 0x3ffffff;
    /* k = 14 */
    lo = Math.imul(al9, bl5);
    mid = Math.imul(al9, bh5);
    mid = (mid + Math.imul(ah9, bl5)) | 0;
    hi = Math.imul(ah9, bh5);
    lo = (lo + Math.imul(al8, bl6)) | 0;
    mid = (mid + Math.imul(al8, bh6)) | 0;
    mid = (mid + Math.imul(ah8, bl6)) | 0;
    hi = (hi + Math.imul(ah8, bh6)) | 0;
    lo = (lo + Math.imul(al7, bl7)) | 0;
    mid = (mid + Math.imul(al7, bh7)) | 0;
    mid = (mid + Math.imul(ah7, bl7)) | 0;
    hi = (hi + Math.imul(ah7, bh7)) | 0;
    lo = (lo + Math.imul(al6, bl8)) | 0;
    mid = (mid + Math.imul(al6, bh8)) | 0;
    mid = (mid + Math.imul(ah6, bl8)) | 0;
    hi = (hi + Math.imul(ah6, bh8)) | 0;
    lo = (lo + Math.imul(al5, bl9)) | 0;
    mid = (mid + Math.imul(al5, bh9)) | 0;
    mid = (mid + Math.imul(ah5, bl9)) | 0;
    hi = (hi + Math.imul(ah5, bh9)) | 0;
    var w14 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w14 >>> 26)) | 0;
    w14 &= 0x3ffffff;
    /* k = 15 */
    lo = Math.imul(al9, bl6);
    mid = Math.imul(al9, bh6);
    mid = (mid + Math.imul(ah9, bl6)) | 0;
    hi = Math.imul(ah9, bh6);
    lo = (lo + Math.imul(al8, bl7)) | 0;
    mid = (mid + Math.imul(al8, bh7)) | 0;
    mid = (mid + Math.imul(ah8, bl7)) | 0;
    hi = (hi + Math.imul(ah8, bh7)) | 0;
    lo = (lo + Math.imul(al7, bl8)) | 0;
    mid = (mid + Math.imul(al7, bh8)) | 0;
    mid = (mid + Math.imul(ah7, bl8)) | 0;
    hi = (hi + Math.imul(ah7, bh8)) | 0;
    lo = (lo + Math.imul(al6, bl9)) | 0;
    mid = (mid + Math.imul(al6, bh9)) | 0;
    mid = (mid + Math.imul(ah6, bl9)) | 0;
    hi = (hi + Math.imul(ah6, bh9)) | 0;
    var w15 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w15 >>> 26)) | 0;
    w15 &= 0x3ffffff;
    /* k = 16 */
    lo = Math.imul(al9, bl7);
    mid = Math.imul(al9, bh7);
    mid = (mid + Math.imul(ah9, bl7)) | 0;
    hi = Math.imul(ah9, bh7);
    lo = (lo + Math.imul(al8, bl8)) | 0;
    mid = (mid + Math.imul(al8, bh8)) | 0;
    mid = (mid + Math.imul(ah8, bl8)) | 0;
    hi = (hi + Math.imul(ah8, bh8)) | 0;
    lo = (lo + Math.imul(al7, bl9)) | 0;
    mid = (mid + Math.imul(al7, bh9)) | 0;
    mid = (mid + Math.imul(ah7, bl9)) | 0;
    hi = (hi + Math.imul(ah7, bh9)) | 0;
    var w16 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w16 >>> 26)) | 0;
    w16 &= 0x3ffffff;
    /* k = 17 */
    lo = Math.imul(al9, bl8);
    mid = Math.imul(al9, bh8);
    mid = (mid + Math.imul(ah9, bl8)) | 0;
    hi = Math.imul(ah9, bh8);
    lo = (lo + Math.imul(al8, bl9)) | 0;
    mid = (mid + Math.imul(al8, bh9)) | 0;
    mid = (mid + Math.imul(ah8, bl9)) | 0;
    hi = (hi + Math.imul(ah8, bh9)) | 0;
    var w17 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w17 >>> 26)) | 0;
    w17 &= 0x3ffffff;
    /* k = 18 */
    lo = Math.imul(al9, bl9);
    mid = Math.imul(al9, bh9);
    mid = (mid + Math.imul(ah9, bl9)) | 0;
    hi = Math.imul(ah9, bh9);
    var w18 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w18 >>> 26)) | 0;
    w18 &= 0x3ffffff;
    o[0] = w0;
    o[1] = w1;
    o[2] = w2;
    o[3] = w3;
    o[4] = w4;
    o[5] = w5;
    o[6] = w6;
    o[7] = w7;
    o[8] = w8;
    o[9] = w9;
    o[10] = w10;
    o[11] = w11;
    o[12] = w12;
    o[13] = w13;
    o[14] = w14;
    o[15] = w15;
    o[16] = w16;
    o[17] = w17;
    o[18] = w18;
    if (c !== 0) {
      o[19] = c;
      out.length++;
    }
    return out;
  };

  // Polyfill comb
  if (!Math.imul) {
    comb10MulTo = smallMulTo;
  }

  function bigMulTo (self, num, out) {
    out.negative = num.negative ^ self.negative;
    out.length = self.length + num.length;

    var carry = 0;
    var hncarry = 0;
    for (var k = 0; k < out.length - 1; k++) {
      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
      // note that ncarry could be >= 0x3ffffff
      var ncarry = hncarry;
      hncarry = 0;
      var rword = carry & 0x3ffffff;
      var maxJ = Math.min(k, num.length - 1);
      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
        var i = k - j;
        var a = self.words[i] | 0;
        var b = num.words[j] | 0;
        var r = a * b;

        var lo = r & 0x3ffffff;
        ncarry = (ncarry + ((r / 0x4000000) | 0)) | 0;
        lo = (lo + rword) | 0;
        rword = lo & 0x3ffffff;
        ncarry = (ncarry + (lo >>> 26)) | 0;

        hncarry += ncarry >>> 26;
        ncarry &= 0x3ffffff;
      }
      out.words[k] = rword;
      carry = ncarry;
      ncarry = hncarry;
    }
    if (carry !== 0) {
      out.words[k] = carry;
    } else {
      out.length--;
    }

    return out._strip();
  }

  function jumboMulTo (self, num, out) {
    // Temporary disable, see https://github.com/indutny/bn.js/issues/211
    // var fftm = new FFTM();
    // return fftm.mulp(self, num, out);
    return bigMulTo(self, num, out);
  }

  BN.prototype.mulTo = function mulTo (num, out) {
    var res;
    var len = this.length + num.length;
    if (this.length === 10 && num.length === 10) {
      res = comb10MulTo(this, num, out);
    } else if (len < 63) {
      res = smallMulTo(this, num, out);
    } else if (len < 1024) {
      res = bigMulTo(this, num, out);
    } else {
      res = jumboMulTo(this, num, out);
    }

    return res;
  };

  // Cooley-Tukey algorithm for FFT
  // slightly revisited to rely on looping instead of recursion

  function FFTM (x, y) {
    this.x = x;
    this.y = y;
  }

  FFTM.prototype.makeRBT = function makeRBT (N) {
    var t = new Array(N);
    var l = BN.prototype._countBits(N) - 1;
    for (var i = 0; i < N; i++) {
      t[i] = this.revBin(i, l, N);
    }

    return t;
  };

  // Returns binary-reversed representation of `x`
  FFTM.prototype.revBin = function revBin (x, l, N) {
    if (x === 0 || x === N - 1) return x;

    var rb = 0;
    for (var i = 0; i < l; i++) {
      rb |= (x & 1) << (l - i - 1);
      x >>= 1;
    }

    return rb;
  };

  // Performs "tweedling" phase, therefore 'emulating'
  // behaviour of the recursive algorithm
  FFTM.prototype.permute = function permute (rbt, rws, iws, rtws, itws, N) {
    for (var i = 0; i < N; i++) {
      rtws[i] = rws[rbt[i]];
      itws[i] = iws[rbt[i]];
    }
  };

  FFTM.prototype.transform = function transform (rws, iws, rtws, itws, N, rbt) {
    this.permute(rbt, rws, iws, rtws, itws, N);

    for (var s = 1; s < N; s <<= 1) {
      var l = s << 1;

      var rtwdf = Math.cos(2 * Math.PI / l);
      var itwdf = Math.sin(2 * Math.PI / l);

      for (var p = 0; p < N; p += l) {
        var rtwdf_ = rtwdf;
        var itwdf_ = itwdf;

        for (var j = 0; j < s; j++) {
          var re = rtws[p + j];
          var ie = itws[p + j];

          var ro = rtws[p + j + s];
          var io = itws[p + j + s];

          var rx = rtwdf_ * ro - itwdf_ * io;

          io = rtwdf_ * io + itwdf_ * ro;
          ro = rx;

          rtws[p + j] = re + ro;
          itws[p + j] = ie + io;

          rtws[p + j + s] = re - ro;
          itws[p + j + s] = ie - io;

          /* jshint maxdepth : false */
          if (j !== l) {
            rx = rtwdf * rtwdf_ - itwdf * itwdf_;

            itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
            rtwdf_ = rx;
          }
        }
      }
    }
  };

  FFTM.prototype.guessLen13b = function guessLen13b (n, m) {
    var N = Math.max(m, n) | 1;
    var odd = N & 1;
    var i = 0;
    for (N = N / 2 | 0; N; N = N >>> 1) {
      i++;
    }

    return 1 << i + 1 + odd;
  };

  FFTM.prototype.conjugate = function conjugate (rws, iws, N) {
    if (N <= 1) return;

    for (var i = 0; i < N / 2; i++) {
      var t = rws[i];

      rws[i] = rws[N - i - 1];
      rws[N - i - 1] = t;

      t = iws[i];

      iws[i] = -iws[N - i - 1];
      iws[N - i - 1] = -t;
    }
  };

  FFTM.prototype.normalize13b = function normalize13b (ws, N) {
    var carry = 0;
    for (var i = 0; i < N / 2; i++) {
      var w = Math.round(ws[2 * i + 1] / N) * 0x2000 +
        Math.round(ws[2 * i] / N) +
        carry;

      ws[i] = w & 0x3ffffff;

      if (w < 0x4000000) {
        carry = 0;
      } else {
        carry = w / 0x4000000 | 0;
      }
    }

    return ws;
  };

  FFTM.prototype.convert13b = function convert13b (ws, len, rws, N) {
    var carry = 0;
    for (var i = 0; i < len; i++) {
      carry = carry + (ws[i] | 0);

      rws[2 * i] = carry & 0x1fff; carry = carry >>> 13;
      rws[2 * i + 1] = carry & 0x1fff; carry = carry >>> 13;
    }

    // Pad with zeroes
    for (i = 2 * len; i < N; ++i) {
      rws[i] = 0;
    }

    assert(carry === 0);
    assert((carry & ~0x1fff) === 0);
  };

  FFTM.prototype.stub = function stub (N) {
    var ph = new Array(N);
    for (var i = 0; i < N; i++) {
      ph[i] = 0;
    }

    return ph;
  };

  FFTM.prototype.mulp = function mulp (x, y, out) {
    var N = 2 * this.guessLen13b(x.length, y.length);

    var rbt = this.makeRBT(N);

    var _ = this.stub(N);

    var rws = new Array(N);
    var rwst = new Array(N);
    var iwst = new Array(N);

    var nrws = new Array(N);
    var nrwst = new Array(N);
    var niwst = new Array(N);

    var rmws = out.words;
    rmws.length = N;

    this.convert13b(x.words, x.length, rws, N);
    this.convert13b(y.words, y.length, nrws, N);

    this.transform(rws, _, rwst, iwst, N, rbt);
    this.transform(nrws, _, nrwst, niwst, N, rbt);

    for (var i = 0; i < N; i++) {
      var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
      iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
      rwst[i] = rx;
    }

    this.conjugate(rwst, iwst, N);
    this.transform(rwst, iwst, rmws, _, N, rbt);
    this.conjugate(rmws, _, N);
    this.normalize13b(rmws, N);

    out.negative = x.negative ^ y.negative;
    out.length = x.length + y.length;
    return out._strip();
  };

  // Multiply `this` by `num`
  BN.prototype.mul = function mul (num) {
    var out = new BN(null);
    out.words = new Array(this.length + num.length);
    return this.mulTo(num, out);
  };

  // Multiply employing FFT
  BN.prototype.mulf = function mulf (num) {
    var out = new BN(null);
    out.words = new Array(this.length + num.length);
    return jumboMulTo(this, num, out);
  };

  // In-place Multiplication
  BN.prototype.imul = function imul (num) {
    return this.clone().mulTo(num, this);
  };

  BN.prototype.imuln = function imuln (num) {
    var isNegNum = num < 0;
    if (isNegNum) num = -num;

    assert(typeof num === 'number');
    assert(num < 0x4000000);

    // Carry
    var carry = 0;
    for (var i = 0; i < this.length; i++) {
      var w = (this.words[i] | 0) * num;
      var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
      carry >>= 26;
      carry += (w / 0x4000000) | 0;
      // NOTE: lo is 27bit maximum
      carry += lo >>> 26;
      this.words[i] = lo & 0x3ffffff;
    }

    if (carry !== 0) {
      this.words[i] = carry;
      this.length++;
    }

    return isNegNum ? this.ineg() : this;
  };

  BN.prototype.muln = function muln (num) {
    return this.clone().imuln(num);
  };

  // `this` * `this`
  BN.prototype.sqr = function sqr () {
    return this.mul(this);
  };

  // `this` * `this` in-place
  BN.prototype.isqr = function isqr () {
    return this.imul(this.clone());
  };

  // Math.pow(`this`, `num`)
  BN.prototype.pow = function pow (num) {
    var w = toBitArray(num);
    if (w.length === 0) return new BN(1);

    // Skip leading zeroes
    var res = this;
    for (var i = 0; i < w.length; i++, res = res.sqr()) {
      if (w[i] !== 0) break;
    }

    if (++i < w.length) {
      for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
        if (w[i] === 0) continue;

        res = res.mul(q);
      }
    }

    return res;
  };

  // Shift-left in-place
  BN.prototype.iushln = function iushln (bits) {
    assert(typeof bits === 'number' && bits >= 0);
    var r = bits % 26;
    var s = (bits - r) / 26;
    var carryMask = (0x3ffffff >>> (26 - r)) << (26 - r);
    var i;

    if (r !== 0) {
      var carry = 0;

      for (i = 0; i < this.length; i++) {
        var newCarry = this.words[i] & carryMask;
        var c = ((this.words[i] | 0) - newCarry) << r;
        this.words[i] = c | carry;
        carry = newCarry >>> (26 - r);
      }

      if (carry) {
        this.words[i] = carry;
        this.length++;
      }
    }

    if (s !== 0) {
      for (i = this.length - 1; i >= 0; i--) {
        this.words[i + s] = this.words[i];
      }

      for (i = 0; i < s; i++) {
        this.words[i] = 0;
      }

      this.length += s;
    }

    return this._strip();
  };

  BN.prototype.ishln = function ishln (bits) {
    // TODO(indutny): implement me
    assert(this.negative === 0);
    return this.iushln(bits);
  };

  // Shift-right in-place
  // NOTE: `hint` is a lowest bit before trailing zeroes
  // NOTE: if `extended` is present - it will be filled with destroyed bits
  BN.prototype.iushrn = function iushrn (bits, hint, extended) {
    assert(typeof bits === 'number' && bits >= 0);
    var h;
    if (hint) {
      h = (hint - (hint % 26)) / 26;
    } else {
      h = 0;
    }

    var r = bits % 26;
    var s = Math.min((bits - r) / 26, this.length);
    var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
    var maskedWords = extended;

    h -= s;
    h = Math.max(0, h);

    // Extended mode, copy masked part
    if (maskedWords) {
      for (var i = 0; i < s; i++) {
        maskedWords.words[i] = this.words[i];
      }
      maskedWords.length = s;
    }

    if (s === 0) {
      // No-op, we should not move anything at all
    } else if (this.length > s) {
      this.length -= s;
      for (i = 0; i < this.length; i++) {
        this.words[i] = this.words[i + s];
      }
    } else {
      this.words[0] = 0;
      this.length = 1;
    }

    var carry = 0;
    for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
      var word = this.words[i] | 0;
      this.words[i] = (carry << (26 - r)) | (word >>> r);
      carry = word & mask;
    }

    // Push carried bits as a mask
    if (maskedWords && carry !== 0) {
      maskedWords.words[maskedWords.length++] = carry;
    }

    if (this.length === 0) {
      this.words[0] = 0;
      this.length = 1;
    }

    return this._strip();
  };

  BN.prototype.ishrn = function ishrn (bits, hint, extended) {
    // TODO(indutny): implement me
    assert(this.negative === 0);
    return this.iushrn(bits, hint, extended);
  };

  // Shift-left
  BN.prototype.shln = function shln (bits) {
    return this.clone().ishln(bits);
  };

  BN.prototype.ushln = function ushln (bits) {
    return this.clone().iushln(bits);
  };

  // Shift-right
  BN.prototype.shrn = function shrn (bits) {
    return this.clone().ishrn(bits);
  };

  BN.prototype.ushrn = function ushrn (bits) {
    return this.clone().iushrn(bits);
  };

  // Test if n bit is set
  BN.prototype.testn = function testn (bit) {
    assert(typeof bit === 'number' && bit >= 0);
    var r = bit % 26;
    var s = (bit - r) / 26;
    var q = 1 << r;

    // Fast case: bit is much higher than all existing words
    if (this.length <= s) return false;

    // Check bit and return
    var w = this.words[s];

    return !!(w & q);
  };

  // Return only lowers bits of number (in-place)
  BN.prototype.imaskn = function imaskn (bits) {
    assert(typeof bits === 'number' && bits >= 0);
    var r = bits % 26;
    var s = (bits - r) / 26;

    assert(this.negative === 0, 'imaskn works only with positive numbers');

    if (this.length <= s) {
      return this;
    }

    if (r !== 0) {
      s++;
    }
    this.length = Math.min(s, this.length);

    if (r !== 0) {
      var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
      this.words[this.length - 1] &= mask;
    }

    return this._strip();
  };

  // Return only lowers bits of number
  BN.prototype.maskn = function maskn (bits) {
    return this.clone().imaskn(bits);
  };

  // Add plain number `num` to `this`
  BN.prototype.iaddn = function iaddn (num) {
    assert(typeof num === 'number');
    assert(num < 0x4000000);
    if (num < 0) return this.isubn(-num);

    // Possible sign change
    if (this.negative !== 0) {
      if (this.length === 1 && (this.words[0] | 0) <= num) {
        this.words[0] = num - (this.words[0] | 0);
        this.negative = 0;
        return this;
      }

      this.negative = 0;
      this.isubn(num);
      this.negative = 1;
      return this;
    }

    // Add without checks
    return this._iaddn(num);
  };

  BN.prototype._iaddn = function _iaddn (num) {
    this.words[0] += num;

    // Carry
    for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
      this.words[i] -= 0x4000000;
      if (i === this.length - 1) {
        this.words[i + 1] = 1;
      } else {
        this.words[i + 1]++;
      }
    }
    this.length = Math.max(this.length, i + 1);

    return this;
  };

  // Subtract plain number `num` from `this`
  BN.prototype.isubn = function isubn (num) {
    assert(typeof num === 'number');
    assert(num < 0x4000000);
    if (num < 0) return this.iaddn(-num);

    if (this.negative !== 0) {
      this.negative = 0;
      this.iaddn(num);
      this.negative = 1;
      return this;
    }

    this.words[0] -= num;

    if (this.length === 1 && this.words[0] < 0) {
      this.words[0] = -this.words[0];
      this.negative = 1;
    } else {
      // Carry
      for (var i = 0; i < this.length && this.words[i] < 0; i++) {
        this.words[i] += 0x4000000;
        this.words[i + 1] -= 1;
      }
    }

    return this._strip();
  };

  BN.prototype.addn = function addn (num) {
    return this.clone().iaddn(num);
  };

  BN.prototype.subn = function subn (num) {
    return this.clone().isubn(num);
  };

  BN.prototype.iabs = function iabs () {
    this.negative = 0;

    return this;
  };

  BN.prototype.abs = function abs () {
    return this.clone().iabs();
  };

  BN.prototype._ishlnsubmul = function _ishlnsubmul (num, mul, shift) {
    var len = num.length + shift;
    var i;

    this._expand(len);

    var w;
    var carry = 0;
    for (i = 0; i < num.length; i++) {
      w = (this.words[i + shift] | 0) + carry;
      var right = (num.words[i] | 0) * mul;
      w -= right & 0x3ffffff;
      carry = (w >> 26) - ((right / 0x4000000) | 0);
      this.words[i + shift] = w & 0x3ffffff;
    }
    for (; i < this.length - shift; i++) {
      w = (this.words[i + shift] | 0) + carry;
      carry = w >> 26;
      this.words[i + shift] = w & 0x3ffffff;
    }

    if (carry === 0) return this._strip();

    // Subtraction overflow
    assert(carry === -1);
    carry = 0;
    for (i = 0; i < this.length; i++) {
      w = -(this.words[i] | 0) + carry;
      carry = w >> 26;
      this.words[i] = w & 0x3ffffff;
    }
    this.negative = 1;

    return this._strip();
  };

  BN.prototype._wordDiv = function _wordDiv (num, mode) {
    var shift = this.length - num.length;

    var a = this.clone();
    var b = num;

    // Normalize
    var bhi = b.words[b.length - 1] | 0;
    var bhiBits = this._countBits(bhi);
    shift = 26 - bhiBits;
    if (shift !== 0) {
      b = b.ushln(shift);
      a.iushln(shift);
      bhi = b.words[b.length - 1] | 0;
    }

    // Initialize quotient
    var m = a.length - b.length;
    var q;

    if (mode !== 'mod') {
      q = new BN(null);
      q.length = m + 1;
      q.words = new Array(q.length);
      for (var i = 0; i < q.length; i++) {
        q.words[i] = 0;
      }
    }

    var diff = a.clone()._ishlnsubmul(b, 1, m);
    if (diff.negative === 0) {
      a = diff;
      if (q) {
        q.words[m] = 1;
      }
    }

    for (var j = m - 1; j >= 0; j--) {
      var qj = (a.words[b.length + j] | 0) * 0x4000000 +
        (a.words[b.length + j - 1] | 0);

      // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
      // (0x7ffffff)
      qj = Math.min((qj / bhi) | 0, 0x3ffffff);

      a._ishlnsubmul(b, qj, j);
      while (a.negative !== 0) {
        qj--;
        a.negative = 0;
        a._ishlnsubmul(b, 1, j);
        if (!a.isZero()) {
          a.negative ^= 1;
        }
      }
      if (q) {
        q.words[j] = qj;
      }
    }
    if (q) {
      q._strip();
    }
    a._strip();

    // Denormalize
    if (mode !== 'div' && shift !== 0) {
      a.iushrn(shift);
    }

    return {
      div: q || null,
      mod: a
    };
  };

  // NOTE: 1) `mode` can be set to `mod` to request mod only,
  //       to `div` to request div only, or be absent to
  //       request both div & mod
  //       2) `positive` is true if unsigned mod is requested
  BN.prototype.divmod = function divmod (num, mode, positive) {
    assert(!num.isZero());

    if (this.isZero()) {
      return {
        div: new BN(0),
        mod: new BN(0)
      };
    }

    var div, mod, res;
    if (this.negative !== 0 && num.negative === 0) {
      res = this.neg().divmod(num, mode);

      if (mode !== 'mod') {
        div = res.div.neg();
      }

      if (mode !== 'div') {
        mod = res.mod.neg();
        if (positive && mod.negative !== 0) {
          mod.iadd(num);
        }
      }

      return {
        div: div,
        mod: mod
      };
    }

    if (this.negative === 0 && num.negative !== 0) {
      res = this.divmod(num.neg(), mode);

      if (mode !== 'mod') {
        div = res.div.neg();
      }

      return {
        div: div,
        mod: res.mod
      };
    }

    if ((this.negative & num.negative) !== 0) {
      res = this.neg().divmod(num.neg(), mode);

      if (mode !== 'div') {
        mod = res.mod.neg();
        if (positive && mod.negative !== 0) {
          mod.isub(num);
        }
      }

      return {
        div: res.div,
        mod: mod
      };
    }

    // Both numbers are positive at this point

    // Strip both numbers to approximate shift value
    if (num.length > this.length || this.cmp(num) < 0) {
      return {
        div: new BN(0),
        mod: this
      };
    }

    // Very short reduction
    if (num.length === 1) {
      if (mode === 'div') {
        return {
          div: this.divn(num.words[0]),
          mod: null
        };
      }

      if (mode === 'mod') {
        return {
          div: null,
          mod: new BN(this.modrn(num.words[0]))
        };
      }

      return {
        div: this.divn(num.words[0]),
        mod: new BN(this.modrn(num.words[0]))
      };
    }

    return this._wordDiv(num, mode);
  };

  // Find `this` / `num`
  BN.prototype.div = function div (num) {
    return this.divmod(num, 'div', false).div;
  };

  // Find `this` % `num`
  BN.prototype.mod = function mod (num) {
    return this.divmod(num, 'mod', false).mod;
  };

  BN.prototype.umod = function umod (num) {
    return this.divmod(num, 'mod', true).mod;
  };

  // Find Round(`this` / `num`)
  BN.prototype.divRound = function divRound (num) {
    var dm = this.divmod(num);

    // Fast case - exact division
    if (dm.mod.isZero()) return dm.div;

    var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

    var half = num.ushrn(1);
    var r2 = num.andln(1);
    var cmp = mod.cmp(half);

    // Round down
    if (cmp < 0 || (r2 === 1 && cmp === 0)) return dm.div;

    // Round up
    return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
  };

  BN.prototype.modrn = function modrn (num) {
    var isNegNum = num < 0;
    if (isNegNum) num = -num;

    assert(num <= 0x3ffffff);
    var p = (1 << 26) % num;

    var acc = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      acc = (p * acc + (this.words[i] | 0)) % num;
    }

    return isNegNum ? -acc : acc;
  };

  // WARNING: DEPRECATED
  BN.prototype.modn = function modn (num) {
    return this.modrn(num);
  };

  // In-place division by number
  BN.prototype.idivn = function idivn (num) {
    var isNegNum = num < 0;
    if (isNegNum) num = -num;

    assert(num <= 0x3ffffff);

    var carry = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      var w = (this.words[i] | 0) + carry * 0x4000000;
      this.words[i] = (w / num) | 0;
      carry = w % num;
    }

    this._strip();
    return isNegNum ? this.ineg() : this;
  };

  BN.prototype.divn = function divn (num) {
    return this.clone().idivn(num);
  };

  BN.prototype.egcd = function egcd (p) {
    assert(p.negative === 0);
    assert(!p.isZero());

    var x = this;
    var y = p.clone();

    if (x.negative !== 0) {
      x = x.umod(p);
    } else {
      x = x.clone();
    }

    // A * x + B * y = x
    var A = new BN(1);
    var B = new BN(0);

    // C * x + D * y = y
    var C = new BN(0);
    var D = new BN(1);

    var g = 0;

    while (x.isEven() && y.isEven()) {
      x.iushrn(1);
      y.iushrn(1);
      ++g;
    }

    var yp = y.clone();
    var xp = x.clone();

    while (!x.isZero()) {
      for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
      if (i > 0) {
        x.iushrn(i);
        while (i-- > 0) {
          if (A.isOdd() || B.isOdd()) {
            A.iadd(yp);
            B.isub(xp);
          }

          A.iushrn(1);
          B.iushrn(1);
        }
      }

      for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
      if (j > 0) {
        y.iushrn(j);
        while (j-- > 0) {
          if (C.isOdd() || D.isOdd()) {
            C.iadd(yp);
            D.isub(xp);
          }

          C.iushrn(1);
          D.iushrn(1);
        }
      }

      if (x.cmp(y) >= 0) {
        x.isub(y);
        A.isub(C);
        B.isub(D);
      } else {
        y.isub(x);
        C.isub(A);
        D.isub(B);
      }
    }

    return {
      a: C,
      b: D,
      gcd: y.iushln(g)
    };
  };

  // This is reduced incarnation of the binary EEA
  // above, designated to invert members of the
  // _prime_ fields F(p) at a maximal speed
  BN.prototype._invmp = function _invmp (p) {
    assert(p.negative === 0);
    assert(!p.isZero());

    var a = this;
    var b = p.clone();

    if (a.negative !== 0) {
      a = a.umod(p);
    } else {
      a = a.clone();
    }

    var x1 = new BN(1);
    var x2 = new BN(0);

    var delta = b.clone();

    while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
      for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
      if (i > 0) {
        a.iushrn(i);
        while (i-- > 0) {
          if (x1.isOdd()) {
            x1.iadd(delta);
          }

          x1.iushrn(1);
        }
      }

      for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
      if (j > 0) {
        b.iushrn(j);
        while (j-- > 0) {
          if (x2.isOdd()) {
            x2.iadd(delta);
          }

          x2.iushrn(1);
        }
      }

      if (a.cmp(b) >= 0) {
        a.isub(b);
        x1.isub(x2);
      } else {
        b.isub(a);
        x2.isub(x1);
      }
    }

    var res;
    if (a.cmpn(1) === 0) {
      res = x1;
    } else {
      res = x2;
    }

    if (res.cmpn(0) < 0) {
      res.iadd(p);
    }

    return res;
  };

  BN.prototype.gcd = function gcd (num) {
    if (this.isZero()) return num.abs();
    if (num.isZero()) return this.abs();

    var a = this.clone();
    var b = num.clone();
    a.negative = 0;
    b.negative = 0;

    // Remove common factor of two
    for (var shift = 0; a.isEven() && b.isEven(); shift++) {
      a.iushrn(1);
      b.iushrn(1);
    }

    do {
      while (a.isEven()) {
        a.iushrn(1);
      }
      while (b.isEven()) {
        b.iushrn(1);
      }

      var r = a.cmp(b);
      if (r < 0) {
        // Swap `a` and `b` to make `a` always bigger than `b`
        var t = a;
        a = b;
        b = t;
      } else if (r === 0 || b.cmpn(1) === 0) {
        break;
      }

      a.isub(b);
    } while (true);

    return b.iushln(shift);
  };

  // Invert number in the field F(num)
  BN.prototype.invm = function invm (num) {
    return this.egcd(num).a.umod(num);
  };

  BN.prototype.isEven = function isEven () {
    return (this.words[0] & 1) === 0;
  };

  BN.prototype.isOdd = function isOdd () {
    return (this.words[0] & 1) === 1;
  };

  // And first word and num
  BN.prototype.andln = function andln (num) {
    return this.words[0] & num;
  };

  // Increment at the bit position in-line
  BN.prototype.bincn = function bincn (bit) {
    assert(typeof bit === 'number');
    var r = bit % 26;
    var s = (bit - r) / 26;
    var q = 1 << r;

    // Fast case: bit is much higher than all existing words
    if (this.length <= s) {
      this._expand(s + 1);
      this.words[s] |= q;
      return this;
    }

    // Add bit and propagate, if needed
    var carry = q;
    for (var i = s; carry !== 0 && i < this.length; i++) {
      var w = this.words[i] | 0;
      w += carry;
      carry = w >>> 26;
      w &= 0x3ffffff;
      this.words[i] = w;
    }
    if (carry !== 0) {
      this.words[i] = carry;
      this.length++;
    }
    return this;
  };

  BN.prototype.isZero = function isZero () {
    return this.length === 1 && this.words[0] === 0;
  };

  BN.prototype.cmpn = function cmpn (num) {
    var negative = num < 0;

    if (this.negative !== 0 && !negative) return -1;
    if (this.negative === 0 && negative) return 1;

    this._strip();

    var res;
    if (this.length > 1) {
      res = 1;
    } else {
      if (negative) {
        num = -num;
      }

      assert(num <= 0x3ffffff, 'Number is too big');

      var w = this.words[0] | 0;
      res = w === num ? 0 : w < num ? -1 : 1;
    }
    if (this.negative !== 0) return -res | 0;
    return res;
  };

  // Compare two numbers and return:
  // 1 - if `this` > `num`
  // 0 - if `this` == `num`
  // -1 - if `this` < `num`
  BN.prototype.cmp = function cmp (num) {
    if (this.negative !== 0 && num.negative === 0) return -1;
    if (this.negative === 0 && num.negative !== 0) return 1;

    var res = this.ucmp(num);
    if (this.negative !== 0) return -res | 0;
    return res;
  };

  // Unsigned comparison
  BN.prototype.ucmp = function ucmp (num) {
    // At this point both numbers have the same sign
    if (this.length > num.length) return 1;
    if (this.length < num.length) return -1;

    var res = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      var a = this.words[i] | 0;
      var b = num.words[i] | 0;

      if (a === b) continue;
      if (a < b) {
        res = -1;
      } else if (a > b) {
        res = 1;
      }
      break;
    }
    return res;
  };

  BN.prototype.gtn = function gtn (num) {
    return this.cmpn(num) === 1;
  };

  BN.prototype.gt = function gt (num) {
    return this.cmp(num) === 1;
  };

  BN.prototype.gten = function gten (num) {
    return this.cmpn(num) >= 0;
  };

  BN.prototype.gte = function gte (num) {
    return this.cmp(num) >= 0;
  };

  BN.prototype.ltn = function ltn (num) {
    return this.cmpn(num) === -1;
  };

  BN.prototype.lt = function lt (num) {
    return this.cmp(num) === -1;
  };

  BN.prototype.lten = function lten (num) {
    return this.cmpn(num) <= 0;
  };

  BN.prototype.lte = function lte (num) {
    return this.cmp(num) <= 0;
  };

  BN.prototype.eqn = function eqn (num) {
    return this.cmpn(num) === 0;
  };

  BN.prototype.eq = function eq (num) {
    return this.cmp(num) === 0;
  };

  //
  // A reduce context, could be using montgomery or something better, depending
  // on the `m` itself.
  //
  BN.red = function red (num) {
    return new Red(num);
  };

  BN.prototype.toRed = function toRed (ctx) {
    assert(!this.red, 'Already a number in reduction context');
    assert(this.negative === 0, 'red works only with positives');
    return ctx.convertTo(this)._forceRed(ctx);
  };

  BN.prototype.fromRed = function fromRed () {
    assert(this.red, 'fromRed works only with numbers in reduction context');
    return this.red.convertFrom(this);
  };

  BN.prototype._forceRed = function _forceRed (ctx) {
    this.red = ctx;
    return this;
  };

  BN.prototype.forceRed = function forceRed (ctx) {
    assert(!this.red, 'Already a number in reduction context');
    return this._forceRed(ctx);
  };

  BN.prototype.redAdd = function redAdd (num) {
    assert(this.red, 'redAdd works only with red numbers');
    return this.red.add(this, num);
  };

  BN.prototype.redIAdd = function redIAdd (num) {
    assert(this.red, 'redIAdd works only with red numbers');
    return this.red.iadd(this, num);
  };

  BN.prototype.redSub = function redSub (num) {
    assert(this.red, 'redSub works only with red numbers');
    return this.red.sub(this, num);
  };

  BN.prototype.redISub = function redISub (num) {
    assert(this.red, 'redISub works only with red numbers');
    return this.red.isub(this, num);
  };

  BN.prototype.redShl = function redShl (num) {
    assert(this.red, 'redShl works only with red numbers');
    return this.red.shl(this, num);
  };

  BN.prototype.redMul = function redMul (num) {
    assert(this.red, 'redMul works only with red numbers');
    this.red._verify2(this, num);
    return this.red.mul(this, num);
  };

  BN.prototype.redIMul = function redIMul (num) {
    assert(this.red, 'redMul works only with red numbers');
    this.red._verify2(this, num);
    return this.red.imul(this, num);
  };

  BN.prototype.redSqr = function redSqr () {
    assert(this.red, 'redSqr works only with red numbers');
    this.red._verify1(this);
    return this.red.sqr(this);
  };

  BN.prototype.redISqr = function redISqr () {
    assert(this.red, 'redISqr works only with red numbers');
    this.red._verify1(this);
    return this.red.isqr(this);
  };

  // Square root over p
  BN.prototype.redSqrt = function redSqrt () {
    assert(this.red, 'redSqrt works only with red numbers');
    this.red._verify1(this);
    return this.red.sqrt(this);
  };

  BN.prototype.redInvm = function redInvm () {
    assert(this.red, 'redInvm works only with red numbers');
    this.red._verify1(this);
    return this.red.invm(this);
  };

  // Return negative clone of `this` % `red modulo`
  BN.prototype.redNeg = function redNeg () {
    assert(this.red, 'redNeg works only with red numbers');
    this.red._verify1(this);
    return this.red.neg(this);
  };

  BN.prototype.redPow = function redPow (num) {
    assert(this.red && !num.red, 'redPow(normalNum)');
    this.red._verify1(this);
    return this.red.pow(this, num);
  };

  // Prime numbers with efficient reduction
  var primes = {
    k256: null,
    p224: null,
    p192: null,
    p25519: null
  };

  // Pseudo-Mersenne prime
  function MPrime (name, p) {
    // P = 2 ^ N - K
    this.name = name;
    this.p = new BN(p, 16);
    this.n = this.p.bitLength();
    this.k = new BN(1).iushln(this.n).isub(this.p);

    this.tmp = this._tmp();
  }

  MPrime.prototype._tmp = function _tmp () {
    var tmp = new BN(null);
    tmp.words = new Array(Math.ceil(this.n / 13));
    return tmp;
  };

  MPrime.prototype.ireduce = function ireduce (num) {
    // Assumes that `num` is less than `P^2`
    // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
    var r = num;
    var rlen;

    do {
      this.split(r, this.tmp);
      r = this.imulK(r);
      r = r.iadd(this.tmp);
      rlen = r.bitLength();
    } while (rlen > this.n);

    var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
    if (cmp === 0) {
      r.words[0] = 0;
      r.length = 1;
    } else if (cmp > 0) {
      r.isub(this.p);
    } else {
      if (r.strip !== undefined) {
        // r is a BN v4 instance
        r.strip();
      } else {
        // r is a BN v5 instance
        r._strip();
      }
    }

    return r;
  };

  MPrime.prototype.split = function split (input, out) {
    input.iushrn(this.n, 0, out);
  };

  MPrime.prototype.imulK = function imulK (num) {
    return num.imul(this.k);
  };

  function K256 () {
    MPrime.call(
      this,
      'k256',
      'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
  }
  inherits(K256, MPrime);

  K256.prototype.split = function split (input, output) {
    // 256 = 9 * 26 + 22
    var mask = 0x3fffff;

    var outLen = Math.min(input.length, 9);
    for (var i = 0; i < outLen; i++) {
      output.words[i] = input.words[i];
    }
    output.length = outLen;

    if (input.length <= 9) {
      input.words[0] = 0;
      input.length = 1;
      return;
    }

    // Shift by 9 limbs
    var prev = input.words[9];
    output.words[output.length++] = prev & mask;

    for (i = 10; i < input.length; i++) {
      var next = input.words[i] | 0;
      input.words[i - 10] = ((next & mask) << 4) | (prev >>> 22);
      prev = next;
    }
    prev >>>= 22;
    input.words[i - 10] = prev;
    if (prev === 0 && input.length > 10) {
      input.length -= 10;
    } else {
      input.length -= 9;
    }
  };

  K256.prototype.imulK = function imulK (num) {
    // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
    num.words[num.length] = 0;
    num.words[num.length + 1] = 0;
    num.length += 2;

    // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
    var lo = 0;
    for (var i = 0; i < num.length; i++) {
      var w = num.words[i] | 0;
      lo += w * 0x3d1;
      num.words[i] = lo & 0x3ffffff;
      lo = w * 0x40 + ((lo / 0x4000000) | 0);
    }

    // Fast length reduction
    if (num.words[num.length - 1] === 0) {
      num.length--;
      if (num.words[num.length - 1] === 0) {
        num.length--;
      }
    }
    return num;
  };

  function P224 () {
    MPrime.call(
      this,
      'p224',
      'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
  }
  inherits(P224, MPrime);

  function P192 () {
    MPrime.call(
      this,
      'p192',
      'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
  }
  inherits(P192, MPrime);

  function P25519 () {
    // 2 ^ 255 - 19
    MPrime.call(
      this,
      '25519',
      '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
  }
  inherits(P25519, MPrime);

  P25519.prototype.imulK = function imulK (num) {
    // K = 0x13
    var carry = 0;
    for (var i = 0; i < num.length; i++) {
      var hi = (num.words[i] | 0) * 0x13 + carry;
      var lo = hi & 0x3ffffff;
      hi >>>= 26;

      num.words[i] = lo;
      carry = hi;
    }
    if (carry !== 0) {
      num.words[num.length++] = carry;
    }
    return num;
  };

  // Exported mostly for testing purposes, use plain name instead
  BN._prime = function prime (name) {
    // Cached version of prime
    if (primes[name]) return primes[name];

    var prime;
    if (name === 'k256') {
      prime = new K256();
    } else if (name === 'p224') {
      prime = new P224();
    } else if (name === 'p192') {
      prime = new P192();
    } else if (name === 'p25519') {
      prime = new P25519();
    } else {
      throw new Error('Unknown prime ' + name);
    }
    primes[name] = prime;

    return prime;
  };

  //
  // Base reduction engine
  //
  function Red (m) {
    if (typeof m === 'string') {
      var prime = BN._prime(m);
      this.m = prime.p;
      this.prime = prime;
    } else {
      assert(m.gtn(1), 'modulus must be greater than 1');
      this.m = m;
      this.prime = null;
    }
  }

  Red.prototype._verify1 = function _verify1 (a) {
    assert(a.negative === 0, 'red works only with positives');
    assert(a.red, 'red works only with red numbers');
  };

  Red.prototype._verify2 = function _verify2 (a, b) {
    assert((a.negative | b.negative) === 0, 'red works only with positives');
    assert(a.red && a.red === b.red,
      'red works only with red numbers');
  };

  Red.prototype.imod = function imod (a) {
    if (this.prime) return this.prime.ireduce(a)._forceRed(this);

    move(a, a.umod(this.m)._forceRed(this));
    return a;
  };

  Red.prototype.neg = function neg (a) {
    if (a.isZero()) {
      return a.clone();
    }

    return this.m.sub(a)._forceRed(this);
  };

  Red.prototype.add = function add (a, b) {
    this._verify2(a, b);

    var res = a.add(b);
    if (res.cmp(this.m) >= 0) {
      res.isub(this.m);
    }
    return res._forceRed(this);
  };

  Red.prototype.iadd = function iadd (a, b) {
    this._verify2(a, b);

    var res = a.iadd(b);
    if (res.cmp(this.m) >= 0) {
      res.isub(this.m);
    }
    return res;
  };

  Red.prototype.sub = function sub (a, b) {
    this._verify2(a, b);

    var res = a.sub(b);
    if (res.cmpn(0) < 0) {
      res.iadd(this.m);
    }
    return res._forceRed(this);
  };

  Red.prototype.isub = function isub (a, b) {
    this._verify2(a, b);

    var res = a.isub(b);
    if (res.cmpn(0) < 0) {
      res.iadd(this.m);
    }
    return res;
  };

  Red.prototype.shl = function shl (a, num) {
    this._verify1(a);
    return this.imod(a.ushln(num));
  };

  Red.prototype.imul = function imul (a, b) {
    this._verify2(a, b);
    return this.imod(a.imul(b));
  };

  Red.prototype.mul = function mul (a, b) {
    this._verify2(a, b);
    return this.imod(a.mul(b));
  };

  Red.prototype.isqr = function isqr (a) {
    return this.imul(a, a.clone());
  };

  Red.prototype.sqr = function sqr (a) {
    return this.mul(a, a);
  };

  Red.prototype.sqrt = function sqrt (a) {
    if (a.isZero()) return a.clone();

    var mod3 = this.m.andln(3);
    assert(mod3 % 2 === 1);

    // Fast case
    if (mod3 === 3) {
      var pow = this.m.add(new BN(1)).iushrn(2);
      return this.pow(a, pow);
    }

    // Tonelli-Shanks algorithm (Totally unoptimized and slow)
    //
    // Find Q and S, that Q * 2 ^ S = (P - 1)
    var q = this.m.subn(1);
    var s = 0;
    while (!q.isZero() && q.andln(1) === 0) {
      s++;
      q.iushrn(1);
    }
    assert(!q.isZero());

    var one = new BN(1).toRed(this);
    var nOne = one.redNeg();

    // Find quadratic non-residue
    // NOTE: Max is such because of generalized Riemann hypothesis.
    var lpow = this.m.subn(1).iushrn(1);
    var z = this.m.bitLength();
    z = new BN(2 * z * z).toRed(this);

    while (this.pow(z, lpow).cmp(nOne) !== 0) {
      z.redIAdd(nOne);
    }

    var c = this.pow(z, q);
    var r = this.pow(a, q.addn(1).iushrn(1));
    var t = this.pow(a, q);
    var m = s;
    while (t.cmp(one) !== 0) {
      var tmp = t;
      for (var i = 0; tmp.cmp(one) !== 0; i++) {
        tmp = tmp.redSqr();
      }
      assert(i < m);
      var b = this.pow(c, new BN(1).iushln(m - i - 1));

      r = r.redMul(b);
      c = b.redSqr();
      t = t.redMul(c);
      m = i;
    }

    return r;
  };

  Red.prototype.invm = function invm (a) {
    var inv = a._invmp(this.m);
    if (inv.negative !== 0) {
      inv.negative = 0;
      return this.imod(inv).redNeg();
    } else {
      return this.imod(inv);
    }
  };

  Red.prototype.pow = function pow (a, num) {
    if (num.isZero()) return new BN(1).toRed(this);
    if (num.cmpn(1) === 0) return a.clone();

    var windowSize = 4;
    var wnd = new Array(1 << windowSize);
    wnd[0] = new BN(1).toRed(this);
    wnd[1] = a;
    for (var i = 2; i < wnd.length; i++) {
      wnd[i] = this.mul(wnd[i - 1], a);
    }

    var res = wnd[0];
    var current = 0;
    var currentLen = 0;
    var start = num.bitLength() % 26;
    if (start === 0) {
      start = 26;
    }

    for (i = num.length - 1; i >= 0; i--) {
      var word = num.words[i];
      for (var j = start - 1; j >= 0; j--) {
        var bit = (word >> j) & 1;
        if (res !== wnd[0]) {
          res = this.sqr(res);
        }

        if (bit === 0 && current === 0) {
          currentLen = 0;
          continue;
        }

        current <<= 1;
        current |= bit;
        currentLen++;
        if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

        res = this.mul(res, wnd[current]);
        currentLen = 0;
        current = 0;
      }
      start = 26;
    }

    return res;
  };

  Red.prototype.convertTo = function convertTo (num) {
    var r = num.umod(this.m);

    return r === num ? r.clone() : r;
  };

  Red.prototype.convertFrom = function convertFrom (num) {
    var res = num.clone();
    res.red = null;
    return res;
  };

  //
  // Montgomery method engine
  //

  BN.mont = function mont (num) {
    return new Mont(num);
  };

  function Mont (m) {
    Red.call(this, m);

    this.shift = this.m.bitLength();
    if (this.shift % 26 !== 0) {
      this.shift += 26 - (this.shift % 26);
    }

    this.r = new BN(1).iushln(this.shift);
    this.r2 = this.imod(this.r.sqr());
    this.rinv = this.r._invmp(this.m);

    this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
    this.minv = this.minv.umod(this.r);
    this.minv = this.r.sub(this.minv);
  }
  inherits(Mont, Red);

  Mont.prototype.convertTo = function convertTo (num) {
    return this.imod(num.ushln(this.shift));
  };

  Mont.prototype.convertFrom = function convertFrom (num) {
    var r = this.imod(num.mul(this.rinv));
    r.red = null;
    return r;
  };

  Mont.prototype.imul = function imul (a, b) {
    if (a.isZero() || b.isZero()) {
      a.words[0] = 0;
      a.length = 1;
      return a;
    }

    var t = a.imul(b);
    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
    var u = t.isub(c).iushrn(this.shift);
    var res = u;

    if (u.cmp(this.m) >= 0) {
      res = u.isub(this.m);
    } else if (u.cmpn(0) < 0) {
      res = u.iadd(this.m);
    }

    return res._forceRed(this);
  };

  Mont.prototype.mul = function mul (a, b) {
    if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

    var t = a.mul(b);
    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
    var u = t.isub(c).iushrn(this.shift);
    var res = u;
    if (u.cmp(this.m) >= 0) {
      res = u.isub(this.m);
    } else if (u.cmpn(0) < 0) {
      res = u.iadd(this.m);
    }

    return res._forceRed(this);
  };

  Mont.prototype.invm = function invm (a) {
    // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
    var res = this.imod(a._invmp(this.m).mul(this.r2));
    return res._forceRed(this);
  };
})( false || module, this);


/***/ }),

/***/ "./node_modules/hash.js/lib/hash.js":
/*!******************************************!*\
  !*** ./node_modules/hash.js/lib/hash.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var hash = exports;

hash.utils = __webpack_require__(/*! ./hash/utils */ "./node_modules/hash.js/lib/hash/utils.js");
hash.common = __webpack_require__(/*! ./hash/common */ "./node_modules/hash.js/lib/hash/common.js");
hash.sha = __webpack_require__(/*! ./hash/sha */ "./node_modules/hash.js/lib/hash/sha.js");
hash.ripemd = __webpack_require__(/*! ./hash/ripemd */ "./node_modules/hash.js/lib/hash/ripemd.js");
hash.hmac = __webpack_require__(/*! ./hash/hmac */ "./node_modules/hash.js/lib/hash/hmac.js");

// Proxy hash functions to the main object
hash.sha1 = hash.sha.sha1;
hash.sha256 = hash.sha.sha256;
hash.sha224 = hash.sha.sha224;
hash.sha384 = hash.sha.sha384;
hash.sha512 = hash.sha.sha512;
hash.ripemd160 = hash.ripemd.ripemd160;


/***/ }),

/***/ "./node_modules/hash.js/lib/hash/common.js":
/*!*************************************************!*\
  !*** ./node_modules/hash.js/lib/hash/common.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils */ "./node_modules/hash.js/lib/hash/utils.js");
var assert = __webpack_require__(/*! minimalistic-assert */ "./node_modules/minimalistic-assert/index.js");

function BlockHash() {
  this.pending = null;
  this.pendingTotal = 0;
  this.blockSize = this.constructor.blockSize;
  this.outSize = this.constructor.outSize;
  this.hmacStrength = this.constructor.hmacStrength;
  this.padLength = this.constructor.padLength / 8;
  this.endian = 'big';

  this._delta8 = this.blockSize / 8;
  this._delta32 = this.blockSize / 32;
}
exports.BlockHash = BlockHash;

BlockHash.prototype.update = function update(msg, enc) {
  // Convert message to array, pad it, and join into 32bit blocks
  msg = utils.toArray(msg, enc);
  if (!this.pending)
    this.pending = msg;
  else
    this.pending = this.pending.concat(msg);
  this.pendingTotal += msg.length;

  // Enough data, try updating
  if (this.pending.length >= this._delta8) {
    msg = this.pending;

    // Process pending data in blocks
    var r = msg.length % this._delta8;
    this.pending = msg.slice(msg.length - r, msg.length);
    if (this.pending.length === 0)
      this.pending = null;

    msg = utils.join32(msg, 0, msg.length - r, this.endian);
    for (var i = 0; i < msg.length; i += this._delta32)
      this._update(msg, i, i + this._delta32);
  }

  return this;
};

BlockHash.prototype.digest = function digest(enc) {
  this.update(this._pad());
  assert(this.pending === null);

  return this._digest(enc);
};

BlockHash.prototype._pad = function pad() {
  var len = this.pendingTotal;
  var bytes = this._delta8;
  var k = bytes - ((len + this.padLength) % bytes);
  var res = new Array(k + this.padLength);
  res[0] = 0x80;
  for (var i = 1; i < k; i++)
    res[i] = 0;

  // Append length
  len <<= 3;
  if (this.endian === 'big') {
    for (var t = 8; t < this.padLength; t++)
      res[i++] = 0;

    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = (len >>> 24) & 0xff;
    res[i++] = (len >>> 16) & 0xff;
    res[i++] = (len >>> 8) & 0xff;
    res[i++] = len & 0xff;
  } else {
    res[i++] = len & 0xff;
    res[i++] = (len >>> 8) & 0xff;
    res[i++] = (len >>> 16) & 0xff;
    res[i++] = (len >>> 24) & 0xff;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;

    for (t = 8; t < this.padLength; t++)
      res[i++] = 0;
  }

  return res;
};


/***/ }),

/***/ "./node_modules/hash.js/lib/hash/hmac.js":
/*!***********************************************!*\
  !*** ./node_modules/hash.js/lib/hash/hmac.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils */ "./node_modules/hash.js/lib/hash/utils.js");
var assert = __webpack_require__(/*! minimalistic-assert */ "./node_modules/minimalistic-assert/index.js");

function Hmac(hash, key, enc) {
  if (!(this instanceof Hmac))
    return new Hmac(hash, key, enc);
  this.Hash = hash;
  this.blockSize = hash.blockSize / 8;
  this.outSize = hash.outSize / 8;
  this.inner = null;
  this.outer = null;

  this._init(utils.toArray(key, enc));
}
module.exports = Hmac;

Hmac.prototype._init = function init(key) {
  // Shorten key, if needed
  if (key.length > this.blockSize)
    key = new this.Hash().update(key).digest();
  assert(key.length <= this.blockSize);

  // Add padding to key
  for (var i = key.length; i < this.blockSize; i++)
    key.push(0);

  for (i = 0; i < key.length; i++)
    key[i] ^= 0x36;
  this.inner = new this.Hash().update(key);

  // 0x36 ^ 0x5c = 0x6a
  for (i = 0; i < key.length; i++)
    key[i] ^= 0x6a;
  this.outer = new this.Hash().update(key);
};

Hmac.prototype.update = function update(msg, enc) {
  this.inner.update(msg, enc);
  return this;
};

Hmac.prototype.digest = function digest(enc) {
  this.outer.update(this.inner.digest());
  return this.outer.digest(enc);
};


/***/ }),

/***/ "./node_modules/hash.js/lib/hash/ripemd.js":
/*!*************************************************!*\
  !*** ./node_modules/hash.js/lib/hash/ripemd.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils */ "./node_modules/hash.js/lib/hash/utils.js");
var common = __webpack_require__(/*! ./common */ "./node_modules/hash.js/lib/hash/common.js");

var rotl32 = utils.rotl32;
var sum32 = utils.sum32;
var sum32_3 = utils.sum32_3;
var sum32_4 = utils.sum32_4;
var BlockHash = common.BlockHash;

function RIPEMD160() {
  if (!(this instanceof RIPEMD160))
    return new RIPEMD160();

  BlockHash.call(this);

  this.h = [ 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0 ];
  this.endian = 'little';
}
utils.inherits(RIPEMD160, BlockHash);
exports.ripemd160 = RIPEMD160;

RIPEMD160.blockSize = 512;
RIPEMD160.outSize = 160;
RIPEMD160.hmacStrength = 192;
RIPEMD160.padLength = 64;

RIPEMD160.prototype._update = function update(msg, start) {
  var A = this.h[0];
  var B = this.h[1];
  var C = this.h[2];
  var D = this.h[3];
  var E = this.h[4];
  var Ah = A;
  var Bh = B;
  var Ch = C;
  var Dh = D;
  var Eh = E;
  for (var j = 0; j < 80; j++) {
    var T = sum32(
      rotl32(
        sum32_4(A, f(j, B, C, D), msg[r[j] + start], K(j)),
        s[j]),
      E);
    A = E;
    E = D;
    D = rotl32(C, 10);
    C = B;
    B = T;
    T = sum32(
      rotl32(
        sum32_4(Ah, f(79 - j, Bh, Ch, Dh), msg[rh[j] + start], Kh(j)),
        sh[j]),
      Eh);
    Ah = Eh;
    Eh = Dh;
    Dh = rotl32(Ch, 10);
    Ch = Bh;
    Bh = T;
  }
  T = sum32_3(this.h[1], C, Dh);
  this.h[1] = sum32_3(this.h[2], D, Eh);
  this.h[2] = sum32_3(this.h[3], E, Ah);
  this.h[3] = sum32_3(this.h[4], A, Bh);
  this.h[4] = sum32_3(this.h[0], B, Ch);
  this.h[0] = T;
};

RIPEMD160.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'little');
  else
    return utils.split32(this.h, 'little');
};

function f(j, x, y, z) {
  if (j <= 15)
    return x ^ y ^ z;
  else if (j <= 31)
    return (x & y) | ((~x) & z);
  else if (j <= 47)
    return (x | (~y)) ^ z;
  else if (j <= 63)
    return (x & z) | (y & (~z));
  else
    return x ^ (y | (~z));
}

function K(j) {
  if (j <= 15)
    return 0x00000000;
  else if (j <= 31)
    return 0x5a827999;
  else if (j <= 47)
    return 0x6ed9eba1;
  else if (j <= 63)
    return 0x8f1bbcdc;
  else
    return 0xa953fd4e;
}

function Kh(j) {
  if (j <= 15)
    return 0x50a28be6;
  else if (j <= 31)
    return 0x5c4dd124;
  else if (j <= 47)
    return 0x6d703ef3;
  else if (j <= 63)
    return 0x7a6d76e9;
  else
    return 0x00000000;
}

var r = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
];

var rh = [
  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
];

var s = [
  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
];

var sh = [
  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
];


/***/ }),

/***/ "./node_modules/hash.js/lib/hash/sha.js":
/*!**********************************************!*\
  !*** ./node_modules/hash.js/lib/hash/sha.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


exports.sha1 = __webpack_require__(/*! ./sha/1 */ "./node_modules/hash.js/lib/hash/sha/1.js");
exports.sha224 = __webpack_require__(/*! ./sha/224 */ "./node_modules/hash.js/lib/hash/sha/224.js");
exports.sha256 = __webpack_require__(/*! ./sha/256 */ "./node_modules/hash.js/lib/hash/sha/256.js");
exports.sha384 = __webpack_require__(/*! ./sha/384 */ "./node_modules/hash.js/lib/hash/sha/384.js");
exports.sha512 = __webpack_require__(/*! ./sha/512 */ "./node_modules/hash.js/lib/hash/sha/512.js");


/***/ }),

/***/ "./node_modules/hash.js/lib/hash/sha/1.js":
/*!************************************************!*\
  !*** ./node_modules/hash.js/lib/hash/sha/1.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/hash.js/lib/hash/utils.js");
var common = __webpack_require__(/*! ../common */ "./node_modules/hash.js/lib/hash/common.js");
var shaCommon = __webpack_require__(/*! ./common */ "./node_modules/hash.js/lib/hash/sha/common.js");

var rotl32 = utils.rotl32;
var sum32 = utils.sum32;
var sum32_5 = utils.sum32_5;
var ft_1 = shaCommon.ft_1;
var BlockHash = common.BlockHash;

var sha1_K = [
  0x5A827999, 0x6ED9EBA1,
  0x8F1BBCDC, 0xCA62C1D6
];

function SHA1() {
  if (!(this instanceof SHA1))
    return new SHA1();

  BlockHash.call(this);
  this.h = [
    0x67452301, 0xefcdab89, 0x98badcfe,
    0x10325476, 0xc3d2e1f0 ];
  this.W = new Array(80);
}

utils.inherits(SHA1, BlockHash);
module.exports = SHA1;

SHA1.blockSize = 512;
SHA1.outSize = 160;
SHA1.hmacStrength = 80;
SHA1.padLength = 64;

SHA1.prototype._update = function _update(msg, start) {
  var W = this.W;

  for (var i = 0; i < 16; i++)
    W[i] = msg[start + i];

  for(; i < W.length; i++)
    W[i] = rotl32(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

  var a = this.h[0];
  var b = this.h[1];
  var c = this.h[2];
  var d = this.h[3];
  var e = this.h[4];

  for (i = 0; i < W.length; i++) {
    var s = ~~(i / 20);
    var t = sum32_5(rotl32(a, 5), ft_1(s, b, c, d), e, W[i], sha1_K[s]);
    e = d;
    d = c;
    c = rotl32(b, 30);
    b = a;
    a = t;
  }

  this.h[0] = sum32(this.h[0], a);
  this.h[1] = sum32(this.h[1], b);
  this.h[2] = sum32(this.h[2], c);
  this.h[3] = sum32(this.h[3], d);
  this.h[4] = sum32(this.h[4], e);
};

SHA1.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};


/***/ }),

/***/ "./node_modules/hash.js/lib/hash/sha/224.js":
/*!**************************************************!*\
  !*** ./node_modules/hash.js/lib/hash/sha/224.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/hash.js/lib/hash/utils.js");
var SHA256 = __webpack_require__(/*! ./256 */ "./node_modules/hash.js/lib/hash/sha/256.js");

function SHA224() {
  if (!(this instanceof SHA224))
    return new SHA224();

  SHA256.call(this);
  this.h = [
    0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
    0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4 ];
}
utils.inherits(SHA224, SHA256);
module.exports = SHA224;

SHA224.blockSize = 512;
SHA224.outSize = 224;
SHA224.hmacStrength = 192;
SHA224.padLength = 64;

SHA224.prototype._digest = function digest(enc) {
  // Just truncate output
  if (enc === 'hex')
    return utils.toHex32(this.h.slice(0, 7), 'big');
  else
    return utils.split32(this.h.slice(0, 7), 'big');
};



/***/ }),

/***/ "./node_modules/hash.js/lib/hash/sha/256.js":
/*!**************************************************!*\
  !*** ./node_modules/hash.js/lib/hash/sha/256.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/hash.js/lib/hash/utils.js");
var common = __webpack_require__(/*! ../common */ "./node_modules/hash.js/lib/hash/common.js");
var shaCommon = __webpack_require__(/*! ./common */ "./node_modules/hash.js/lib/hash/sha/common.js");
var assert = __webpack_require__(/*! minimalistic-assert */ "./node_modules/minimalistic-assert/index.js");

var sum32 = utils.sum32;
var sum32_4 = utils.sum32_4;
var sum32_5 = utils.sum32_5;
var ch32 = shaCommon.ch32;
var maj32 = shaCommon.maj32;
var s0_256 = shaCommon.s0_256;
var s1_256 = shaCommon.s1_256;
var g0_256 = shaCommon.g0_256;
var g1_256 = shaCommon.g1_256;

var BlockHash = common.BlockHash;

var sha256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function SHA256() {
  if (!(this instanceof SHA256))
    return new SHA256();

  BlockHash.call(this);
  this.h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  this.k = sha256_K;
  this.W = new Array(64);
}
utils.inherits(SHA256, BlockHash);
module.exports = SHA256;

SHA256.blockSize = 512;
SHA256.outSize = 256;
SHA256.hmacStrength = 192;
SHA256.padLength = 64;

SHA256.prototype._update = function _update(msg, start) {
  var W = this.W;

  for (var i = 0; i < 16; i++)
    W[i] = msg[start + i];
  for (; i < W.length; i++)
    W[i] = sum32_4(g1_256(W[i - 2]), W[i - 7], g0_256(W[i - 15]), W[i - 16]);

  var a = this.h[0];
  var b = this.h[1];
  var c = this.h[2];
  var d = this.h[3];
  var e = this.h[4];
  var f = this.h[5];
  var g = this.h[6];
  var h = this.h[7];

  assert(this.k.length === W.length);
  for (i = 0; i < W.length; i++) {
    var T1 = sum32_5(h, s1_256(e), ch32(e, f, g), this.k[i], W[i]);
    var T2 = sum32(s0_256(a), maj32(a, b, c));
    h = g;
    g = f;
    f = e;
    e = sum32(d, T1);
    d = c;
    c = b;
    b = a;
    a = sum32(T1, T2);
  }

  this.h[0] = sum32(this.h[0], a);
  this.h[1] = sum32(this.h[1], b);
  this.h[2] = sum32(this.h[2], c);
  this.h[3] = sum32(this.h[3], d);
  this.h[4] = sum32(this.h[4], e);
  this.h[5] = sum32(this.h[5], f);
  this.h[6] = sum32(this.h[6], g);
  this.h[7] = sum32(this.h[7], h);
};

SHA256.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};


/***/ }),

/***/ "./node_modules/hash.js/lib/hash/sha/384.js":
/*!**************************************************!*\
  !*** ./node_modules/hash.js/lib/hash/sha/384.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/hash.js/lib/hash/utils.js");

var SHA512 = __webpack_require__(/*! ./512 */ "./node_modules/hash.js/lib/hash/sha/512.js");

function SHA384() {
  if (!(this instanceof SHA384))
    return new SHA384();

  SHA512.call(this);
  this.h = [
    0xcbbb9d5d, 0xc1059ed8,
    0x629a292a, 0x367cd507,
    0x9159015a, 0x3070dd17,
    0x152fecd8, 0xf70e5939,
    0x67332667, 0xffc00b31,
    0x8eb44a87, 0x68581511,
    0xdb0c2e0d, 0x64f98fa7,
    0x47b5481d, 0xbefa4fa4 ];
}
utils.inherits(SHA384, SHA512);
module.exports = SHA384;

SHA384.blockSize = 1024;
SHA384.outSize = 384;
SHA384.hmacStrength = 192;
SHA384.padLength = 128;

SHA384.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h.slice(0, 12), 'big');
  else
    return utils.split32(this.h.slice(0, 12), 'big');
};


/***/ }),

/***/ "./node_modules/hash.js/lib/hash/sha/512.js":
/*!**************************************************!*\
  !*** ./node_modules/hash.js/lib/hash/sha/512.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/hash.js/lib/hash/utils.js");
var common = __webpack_require__(/*! ../common */ "./node_modules/hash.js/lib/hash/common.js");
var assert = __webpack_require__(/*! minimalistic-assert */ "./node_modules/minimalistic-assert/index.js");

var rotr64_hi = utils.rotr64_hi;
var rotr64_lo = utils.rotr64_lo;
var shr64_hi = utils.shr64_hi;
var shr64_lo = utils.shr64_lo;
var sum64 = utils.sum64;
var sum64_hi = utils.sum64_hi;
var sum64_lo = utils.sum64_lo;
var sum64_4_hi = utils.sum64_4_hi;
var sum64_4_lo = utils.sum64_4_lo;
var sum64_5_hi = utils.sum64_5_hi;
var sum64_5_lo = utils.sum64_5_lo;

var BlockHash = common.BlockHash;

var sha512_K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
];

function SHA512() {
  if (!(this instanceof SHA512))
    return new SHA512();

  BlockHash.call(this);
  this.h = [
    0x6a09e667, 0xf3bcc908,
    0xbb67ae85, 0x84caa73b,
    0x3c6ef372, 0xfe94f82b,
    0xa54ff53a, 0x5f1d36f1,
    0x510e527f, 0xade682d1,
    0x9b05688c, 0x2b3e6c1f,
    0x1f83d9ab, 0xfb41bd6b,
    0x5be0cd19, 0x137e2179 ];
  this.k = sha512_K;
  this.W = new Array(160);
}
utils.inherits(SHA512, BlockHash);
module.exports = SHA512;

SHA512.blockSize = 1024;
SHA512.outSize = 512;
SHA512.hmacStrength = 192;
SHA512.padLength = 128;

SHA512.prototype._prepareBlock = function _prepareBlock(msg, start) {
  var W = this.W;

  // 32 x 32bit words
  for (var i = 0; i < 32; i++)
    W[i] = msg[start + i];
  for (; i < W.length; i += 2) {
    var c0_hi = g1_512_hi(W[i - 4], W[i - 3]);  // i - 2
    var c0_lo = g1_512_lo(W[i - 4], W[i - 3]);
    var c1_hi = W[i - 14];  // i - 7
    var c1_lo = W[i - 13];
    var c2_hi = g0_512_hi(W[i - 30], W[i - 29]);  // i - 15
    var c2_lo = g0_512_lo(W[i - 30], W[i - 29]);
    var c3_hi = W[i - 32];  // i - 16
    var c3_lo = W[i - 31];

    W[i] = sum64_4_hi(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo);
    W[i + 1] = sum64_4_lo(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo);
  }
};

SHA512.prototype._update = function _update(msg, start) {
  this._prepareBlock(msg, start);

  var W = this.W;

  var ah = this.h[0];
  var al = this.h[1];
  var bh = this.h[2];
  var bl = this.h[3];
  var ch = this.h[4];
  var cl = this.h[5];
  var dh = this.h[6];
  var dl = this.h[7];
  var eh = this.h[8];
  var el = this.h[9];
  var fh = this.h[10];
  var fl = this.h[11];
  var gh = this.h[12];
  var gl = this.h[13];
  var hh = this.h[14];
  var hl = this.h[15];

  assert(this.k.length === W.length);
  for (var i = 0; i < W.length; i += 2) {
    var c0_hi = hh;
    var c0_lo = hl;
    var c1_hi = s1_512_hi(eh, el);
    var c1_lo = s1_512_lo(eh, el);
    var c2_hi = ch64_hi(eh, el, fh, fl, gh, gl);
    var c2_lo = ch64_lo(eh, el, fh, fl, gh, gl);
    var c3_hi = this.k[i];
    var c3_lo = this.k[i + 1];
    var c4_hi = W[i];
    var c4_lo = W[i + 1];

    var T1_hi = sum64_5_hi(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo,
      c4_hi, c4_lo);
    var T1_lo = sum64_5_lo(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo,
      c4_hi, c4_lo);

    c0_hi = s0_512_hi(ah, al);
    c0_lo = s0_512_lo(ah, al);
    c1_hi = maj64_hi(ah, al, bh, bl, ch, cl);
    c1_lo = maj64_lo(ah, al, bh, bl, ch, cl);

    var T2_hi = sum64_hi(c0_hi, c0_lo, c1_hi, c1_lo);
    var T2_lo = sum64_lo(c0_hi, c0_lo, c1_hi, c1_lo);

    hh = gh;
    hl = gl;

    gh = fh;
    gl = fl;

    fh = eh;
    fl = el;

    eh = sum64_hi(dh, dl, T1_hi, T1_lo);
    el = sum64_lo(dl, dl, T1_hi, T1_lo);

    dh = ch;
    dl = cl;

    ch = bh;
    cl = bl;

    bh = ah;
    bl = al;

    ah = sum64_hi(T1_hi, T1_lo, T2_hi, T2_lo);
    al = sum64_lo(T1_hi, T1_lo, T2_hi, T2_lo);
  }

  sum64(this.h, 0, ah, al);
  sum64(this.h, 2, bh, bl);
  sum64(this.h, 4, ch, cl);
  sum64(this.h, 6, dh, dl);
  sum64(this.h, 8, eh, el);
  sum64(this.h, 10, fh, fl);
  sum64(this.h, 12, gh, gl);
  sum64(this.h, 14, hh, hl);
};

SHA512.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};

function ch64_hi(xh, xl, yh, yl, zh) {
  var r = (xh & yh) ^ ((~xh) & zh);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function ch64_lo(xh, xl, yh, yl, zh, zl) {
  var r = (xl & yl) ^ ((~xl) & zl);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function maj64_hi(xh, xl, yh, yl, zh) {
  var r = (xh & yh) ^ (xh & zh) ^ (yh & zh);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function maj64_lo(xh, xl, yh, yl, zh, zl) {
  var r = (xl & yl) ^ (xl & zl) ^ (yl & zl);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s0_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 28);
  var c1_hi = rotr64_hi(xl, xh, 2);  // 34
  var c2_hi = rotr64_hi(xl, xh, 7);  // 39

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s0_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 28);
  var c1_lo = rotr64_lo(xl, xh, 2);  // 34
  var c2_lo = rotr64_lo(xl, xh, 7);  // 39

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s1_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 14);
  var c1_hi = rotr64_hi(xh, xl, 18);
  var c2_hi = rotr64_hi(xl, xh, 9);  // 41

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s1_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 14);
  var c1_lo = rotr64_lo(xh, xl, 18);
  var c2_lo = rotr64_lo(xl, xh, 9);  // 41

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g0_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 1);
  var c1_hi = rotr64_hi(xh, xl, 8);
  var c2_hi = shr64_hi(xh, xl, 7);

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g0_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 1);
  var c1_lo = rotr64_lo(xh, xl, 8);
  var c2_lo = shr64_lo(xh, xl, 7);

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g1_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 19);
  var c1_hi = rotr64_hi(xl, xh, 29);  // 61
  var c2_hi = shr64_hi(xh, xl, 6);

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g1_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 19);
  var c1_lo = rotr64_lo(xl, xh, 29);  // 61
  var c2_lo = shr64_lo(xh, xl, 6);

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}


/***/ }),

/***/ "./node_modules/hash.js/lib/hash/sha/common.js":
/*!*****************************************************!*\
  !*** ./node_modules/hash.js/lib/hash/sha/common.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/hash.js/lib/hash/utils.js");
var rotr32 = utils.rotr32;

function ft_1(s, x, y, z) {
  if (s === 0)
    return ch32(x, y, z);
  if (s === 1 || s === 3)
    return p32(x, y, z);
  if (s === 2)
    return maj32(x, y, z);
}
exports.ft_1 = ft_1;

function ch32(x, y, z) {
  return (x & y) ^ ((~x) & z);
}
exports.ch32 = ch32;

function maj32(x, y, z) {
  return (x & y) ^ (x & z) ^ (y & z);
}
exports.maj32 = maj32;

function p32(x, y, z) {
  return x ^ y ^ z;
}
exports.p32 = p32;

function s0_256(x) {
  return rotr32(x, 2) ^ rotr32(x, 13) ^ rotr32(x, 22);
}
exports.s0_256 = s0_256;

function s1_256(x) {
  return rotr32(x, 6) ^ rotr32(x, 11) ^ rotr32(x, 25);
}
exports.s1_256 = s1_256;

function g0_256(x) {
  return rotr32(x, 7) ^ rotr32(x, 18) ^ (x >>> 3);
}
exports.g0_256 = g0_256;

function g1_256(x) {
  return rotr32(x, 17) ^ rotr32(x, 19) ^ (x >>> 10);
}
exports.g1_256 = g1_256;


/***/ }),

/***/ "./node_modules/hash.js/lib/hash/utils.js":
/*!************************************************!*\
  !*** ./node_modules/hash.js/lib/hash/utils.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var assert = __webpack_require__(/*! minimalistic-assert */ "./node_modules/minimalistic-assert/index.js");
var inherits = __webpack_require__(/*! inherits */ "./node_modules/inherits/inherits_browser.js");

exports.inherits = inherits;

function isSurrogatePair(msg, i) {
  if ((msg.charCodeAt(i) & 0xFC00) !== 0xD800) {
    return false;
  }
  if (i < 0 || i + 1 >= msg.length) {
    return false;
  }
  return (msg.charCodeAt(i + 1) & 0xFC00) === 0xDC00;
}

function toArray(msg, enc) {
  if (Array.isArray(msg))
    return msg.slice();
  if (!msg)
    return [];
  var res = [];
  if (typeof msg === 'string') {
    if (!enc) {
      // Inspired by stringToUtf8ByteArray() in closure-library by Google
      // https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js#L117-L143
      // Apache License 2.0
      // https://github.com/google/closure-library/blob/master/LICENSE
      var p = 0;
      for (var i = 0; i < msg.length; i++) {
        var c = msg.charCodeAt(i);
        if (c < 128) {
          res[p++] = c;
        } else if (c < 2048) {
          res[p++] = (c >> 6) | 192;
          res[p++] = (c & 63) | 128;
        } else if (isSurrogatePair(msg, i)) {
          c = 0x10000 + ((c & 0x03FF) << 10) + (msg.charCodeAt(++i) & 0x03FF);
          res[p++] = (c >> 18) | 240;
          res[p++] = ((c >> 12) & 63) | 128;
          res[p++] = ((c >> 6) & 63) | 128;
          res[p++] = (c & 63) | 128;
        } else {
          res[p++] = (c >> 12) | 224;
          res[p++] = ((c >> 6) & 63) | 128;
          res[p++] = (c & 63) | 128;
        }
      }
    } else if (enc === 'hex') {
      msg = msg.replace(/[^a-z0-9]+/ig, '');
      if (msg.length % 2 !== 0)
        msg = '0' + msg;
      for (i = 0; i < msg.length; i += 2)
        res.push(parseInt(msg[i] + msg[i + 1], 16));
    }
  } else {
    for (i = 0; i < msg.length; i++)
      res[i] = msg[i] | 0;
  }
  return res;
}
exports.toArray = toArray;

function toHex(msg) {
  var res = '';
  for (var i = 0; i < msg.length; i++)
    res += zero2(msg[i].toString(16));
  return res;
}
exports.toHex = toHex;

function htonl(w) {
  var res = (w >>> 24) |
            ((w >>> 8) & 0xff00) |
            ((w << 8) & 0xff0000) |
            ((w & 0xff) << 24);
  return res >>> 0;
}
exports.htonl = htonl;

function toHex32(msg, endian) {
  var res = '';
  for (var i = 0; i < msg.length; i++) {
    var w = msg[i];
    if (endian === 'little')
      w = htonl(w);
    res += zero8(w.toString(16));
  }
  return res;
}
exports.toHex32 = toHex32;

function zero2(word) {
  if (word.length === 1)
    return '0' + word;
  else
    return word;
}
exports.zero2 = zero2;

function zero8(word) {
  if (word.length === 7)
    return '0' + word;
  else if (word.length === 6)
    return '00' + word;
  else if (word.length === 5)
    return '000' + word;
  else if (word.length === 4)
    return '0000' + word;
  else if (word.length === 3)
    return '00000' + word;
  else if (word.length === 2)
    return '000000' + word;
  else if (word.length === 1)
    return '0000000' + word;
  else
    return word;
}
exports.zero8 = zero8;

function join32(msg, start, end, endian) {
  var len = end - start;
  assert(len % 4 === 0);
  var res = new Array(len / 4);
  for (var i = 0, k = start; i < res.length; i++, k += 4) {
    var w;
    if (endian === 'big')
      w = (msg[k] << 24) | (msg[k + 1] << 16) | (msg[k + 2] << 8) | msg[k + 3];
    else
      w = (msg[k + 3] << 24) | (msg[k + 2] << 16) | (msg[k + 1] << 8) | msg[k];
    res[i] = w >>> 0;
  }
  return res;
}
exports.join32 = join32;

function split32(msg, endian) {
  var res = new Array(msg.length * 4);
  for (var i = 0, k = 0; i < msg.length; i++, k += 4) {
    var m = msg[i];
    if (endian === 'big') {
      res[k] = m >>> 24;
      res[k + 1] = (m >>> 16) & 0xff;
      res[k + 2] = (m >>> 8) & 0xff;
      res[k + 3] = m & 0xff;
    } else {
      res[k + 3] = m >>> 24;
      res[k + 2] = (m >>> 16) & 0xff;
      res[k + 1] = (m >>> 8) & 0xff;
      res[k] = m & 0xff;
    }
  }
  return res;
}
exports.split32 = split32;

function rotr32(w, b) {
  return (w >>> b) | (w << (32 - b));
}
exports.rotr32 = rotr32;

function rotl32(w, b) {
  return (w << b) | (w >>> (32 - b));
}
exports.rotl32 = rotl32;

function sum32(a, b) {
  return (a + b) >>> 0;
}
exports.sum32 = sum32;

function sum32_3(a, b, c) {
  return (a + b + c) >>> 0;
}
exports.sum32_3 = sum32_3;

function sum32_4(a, b, c, d) {
  return (a + b + c + d) >>> 0;
}
exports.sum32_4 = sum32_4;

function sum32_5(a, b, c, d, e) {
  return (a + b + c + d + e) >>> 0;
}
exports.sum32_5 = sum32_5;

function sum64(buf, pos, ah, al) {
  var bh = buf[pos];
  var bl = buf[pos + 1];

  var lo = (al + bl) >>> 0;
  var hi = (lo < al ? 1 : 0) + ah + bh;
  buf[pos] = hi >>> 0;
  buf[pos + 1] = lo;
}
exports.sum64 = sum64;

function sum64_hi(ah, al, bh, bl) {
  var lo = (al + bl) >>> 0;
  var hi = (lo < al ? 1 : 0) + ah + bh;
  return hi >>> 0;
}
exports.sum64_hi = sum64_hi;

function sum64_lo(ah, al, bh, bl) {
  var lo = al + bl;
  return lo >>> 0;
}
exports.sum64_lo = sum64_lo;

function sum64_4_hi(ah, al, bh, bl, ch, cl, dh, dl) {
  var carry = 0;
  var lo = al;
  lo = (lo + bl) >>> 0;
  carry += lo < al ? 1 : 0;
  lo = (lo + cl) >>> 0;
  carry += lo < cl ? 1 : 0;
  lo = (lo + dl) >>> 0;
  carry += lo < dl ? 1 : 0;

  var hi = ah + bh + ch + dh + carry;
  return hi >>> 0;
}
exports.sum64_4_hi = sum64_4_hi;

function sum64_4_lo(ah, al, bh, bl, ch, cl, dh, dl) {
  var lo = al + bl + cl + dl;
  return lo >>> 0;
}
exports.sum64_4_lo = sum64_4_lo;

function sum64_5_hi(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
  var carry = 0;
  var lo = al;
  lo = (lo + bl) >>> 0;
  carry += lo < al ? 1 : 0;
  lo = (lo + cl) >>> 0;
  carry += lo < cl ? 1 : 0;
  lo = (lo + dl) >>> 0;
  carry += lo < dl ? 1 : 0;
  lo = (lo + el) >>> 0;
  carry += lo < el ? 1 : 0;

  var hi = ah + bh + ch + dh + eh + carry;
  return hi >>> 0;
}
exports.sum64_5_hi = sum64_5_hi;

function sum64_5_lo(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
  var lo = al + bl + cl + dl + el;

  return lo >>> 0;
}
exports.sum64_5_lo = sum64_5_lo;

function rotr64_hi(ah, al, num) {
  var r = (al << (32 - num)) | (ah >>> num);
  return r >>> 0;
}
exports.rotr64_hi = rotr64_hi;

function rotr64_lo(ah, al, num) {
  var r = (ah << (32 - num)) | (al >>> num);
  return r >>> 0;
}
exports.rotr64_lo = rotr64_lo;

function shr64_hi(ah, al, num) {
  return ah >>> num;
}
exports.shr64_hi = shr64_hi;

function shr64_lo(ah, al, num) {
  var r = (ah << (32 - num)) | (al >>> num);
  return r >>> 0;
}
exports.shr64_lo = shr64_lo;


/***/ }),

/***/ "./node_modules/inherits/inherits_browser.js":
/*!***************************************************!*\
  !*** ./node_modules/inherits/inherits_browser.js ***!
  \***************************************************/
/***/ ((module) => {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}


/***/ }),

/***/ "./node_modules/js-sha3/src/sha3.js":
/*!******************************************!*\
  !*** ./node_modules/js-sha3/src/sha3.js ***!
  \******************************************/
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/**
 * [js-sha3]{@link https://github.com/emn178/js-sha3}
 *
 * @version 0.8.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2015-2018
 * @license MIT
 */
/*jslint bitwise: true */
(function () {
  'use strict';

  var INPUT_ERROR = 'input is invalid type';
  var FINALIZE_ERROR = 'finalize already called';
  var WINDOW = typeof window === 'object';
  var root = WINDOW ? window : {};
  if (root.JS_SHA3_NO_WINDOW) {
    WINDOW = false;
  }
  var WEB_WORKER = !WINDOW && typeof self === 'object';
  var NODE_JS = !root.JS_SHA3_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
  if (NODE_JS) {
    root = __webpack_require__.g;
  } else if (WEB_WORKER) {
    root = self;
  }
  var COMMON_JS = !root.JS_SHA3_NO_COMMON_JS && "object" === 'object' && module.exports;
  var AMD =  true && __webpack_require__.amdO;
  var ARRAY_BUFFER = !root.JS_SHA3_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
  var HEX_CHARS = '0123456789abcdef'.split('');
  var SHAKE_PADDING = [31, 7936, 2031616, 520093696];
  var CSHAKE_PADDING = [4, 1024, 262144, 67108864];
  var KECCAK_PADDING = [1, 256, 65536, 16777216];
  var PADDING = [6, 1536, 393216, 100663296];
  var SHIFT = [0, 8, 16, 24];
  var RC = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649,
    0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0,
    2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771,
    2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
    2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648];
  var BITS = [224, 256, 384, 512];
  var SHAKE_BITS = [128, 256];
  var OUTPUT_TYPES = ['hex', 'buffer', 'arrayBuffer', 'array', 'digest'];
  var CSHAKE_BYTEPAD = {
    '128': 168,
    '256': 136
  };

  if (root.JS_SHA3_NO_NODE_JS || !Array.isArray) {
    Array.isArray = function (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    };
  }

  if (ARRAY_BUFFER && (root.JS_SHA3_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
    ArrayBuffer.isView = function (obj) {
      return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
    };
  }

  var createOutputMethod = function (bits, padding, outputType) {
    return function (message) {
      return new Keccak(bits, padding, bits).update(message)[outputType]();
    };
  };

  var createShakeOutputMethod = function (bits, padding, outputType) {
    return function (message, outputBits) {
      return new Keccak(bits, padding, outputBits).update(message)[outputType]();
    };
  };

  var createCshakeOutputMethod = function (bits, padding, outputType) {
    return function (message, outputBits, n, s) {
      return methods['cshake' + bits].update(message, outputBits, n, s)[outputType]();
    };
  };

  var createKmacOutputMethod = function (bits, padding, outputType) {
    return function (key, message, outputBits, s) {
      return methods['kmac' + bits].update(key, message, outputBits, s)[outputType]();
    };
  };

  var createOutputMethods = function (method, createMethod, bits, padding) {
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createMethod(bits, padding, type);
    }
    return method;
  };

  var createMethod = function (bits, padding) {
    var method = createOutputMethod(bits, padding, 'hex');
    method.create = function () {
      return new Keccak(bits, padding, bits);
    };
    method.update = function (message) {
      return method.create().update(message);
    };
    return createOutputMethods(method, createOutputMethod, bits, padding);
  };

  var createShakeMethod = function (bits, padding) {
    var method = createShakeOutputMethod(bits, padding, 'hex');
    method.create = function (outputBits) {
      return new Keccak(bits, padding, outputBits);
    };
    method.update = function (message, outputBits) {
      return method.create(outputBits).update(message);
    };
    return createOutputMethods(method, createShakeOutputMethod, bits, padding);
  };

  var createCshakeMethod = function (bits, padding) {
    var w = CSHAKE_BYTEPAD[bits];
    var method = createCshakeOutputMethod(bits, padding, 'hex');
    method.create = function (outputBits, n, s) {
      if (!n && !s) {
        return methods['shake' + bits].create(outputBits);
      } else {
        return new Keccak(bits, padding, outputBits).bytepad([n, s], w);
      }
    };
    method.update = function (message, outputBits, n, s) {
      return method.create(outputBits, n, s).update(message);
    };
    return createOutputMethods(method, createCshakeOutputMethod, bits, padding);
  };

  var createKmacMethod = function (bits, padding) {
    var w = CSHAKE_BYTEPAD[bits];
    var method = createKmacOutputMethod(bits, padding, 'hex');
    method.create = function (key, outputBits, s) {
      return new Kmac(bits, padding, outputBits).bytepad(['KMAC', s], w).bytepad([key], w);
    };
    method.update = function (key, message, outputBits, s) {
      return method.create(key, outputBits, s).update(message);
    };
    return createOutputMethods(method, createKmacOutputMethod, bits, padding);
  };

  var algorithms = [
    { name: 'keccak', padding: KECCAK_PADDING, bits: BITS, createMethod: createMethod },
    { name: 'sha3', padding: PADDING, bits: BITS, createMethod: createMethod },
    { name: 'shake', padding: SHAKE_PADDING, bits: SHAKE_BITS, createMethod: createShakeMethod },
    { name: 'cshake', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createCshakeMethod },
    { name: 'kmac', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createKmacMethod }
  ];

  var methods = {}, methodNames = [];

  for (var i = 0; i < algorithms.length; ++i) {
    var algorithm = algorithms[i];
    var bits = algorithm.bits;
    for (var j = 0; j < bits.length; ++j) {
      var methodName = algorithm.name + '_' + bits[j];
      methodNames.push(methodName);
      methods[methodName] = algorithm.createMethod(bits[j], algorithm.padding);
      if (algorithm.name !== 'sha3') {
        var newMethodName = algorithm.name + bits[j];
        methodNames.push(newMethodName);
        methods[newMethodName] = methods[methodName];
      }
    }
  }

  function Keccak(bits, padding, outputBits) {
    this.blocks = [];
    this.s = [];
    this.padding = padding;
    this.outputBits = outputBits;
    this.reset = true;
    this.finalized = false;
    this.block = 0;
    this.start = 0;
    this.blockCount = (1600 - (bits << 1)) >> 5;
    this.byteCount = this.blockCount << 2;
    this.outputBlocks = outputBits >> 5;
    this.extraBytes = (outputBits & 31) >> 3;

    for (var i = 0; i < 50; ++i) {
      this.s[i] = 0;
    }
  }

  Keccak.prototype.update = function (message) {
    if (this.finalized) {
      throw new Error(FINALIZE_ERROR);
    }
    var notString, type = typeof message;
    if (type !== 'string') {
      if (type === 'object') {
        if (message === null) {
          throw new Error(INPUT_ERROR);
        } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        } else if (!Array.isArray(message)) {
          if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
            throw new Error(INPUT_ERROR);
          }
        }
      } else {
        throw new Error(INPUT_ERROR);
      }
      notString = true;
    }
    var blocks = this.blocks, byteCount = this.byteCount, length = message.length,
      blockCount = this.blockCount, index = 0, s = this.s, i, code;

    while (index < length) {
      if (this.reset) {
        this.reset = false;
        blocks[0] = this.block;
        for (i = 1; i < blockCount + 1; ++i) {
          blocks[i] = 0;
        }
      }
      if (notString) {
        for (i = this.start; index < length && i < byteCount; ++index) {
          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = this.start; index < length && i < byteCount; ++index) {
          code = message.charCodeAt(index);
          if (code < 0x80) {
            blocks[i >> 2] |= code << SHIFT[i++ & 3];
          } else if (code < 0x800) {
            blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else if (code < 0xd800 || code >= 0xe000) {
            blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else {
            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
            blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          }
        }
      }
      this.lastByteIndex = i;
      if (i >= byteCount) {
        this.start = i - byteCount;
        this.block = blocks[blockCount];
        for (i = 0; i < blockCount; ++i) {
          s[i] ^= blocks[i];
        }
        f(s);
        this.reset = true;
      } else {
        this.start = i;
      }
    }
    return this;
  };

  Keccak.prototype.encode = function (x, right) {
    var o = x & 255, n = 1;
    var bytes = [o];
    x = x >> 8;
    o = x & 255;
    while (o > 0) {
      bytes.unshift(o);
      x = x >> 8;
      o = x & 255;
      ++n;
    }
    if (right) {
      bytes.push(n);
    } else {
      bytes.unshift(n);
    }
    this.update(bytes);
    return bytes.length;
  };

  Keccak.prototype.encodeString = function (str) {
    var notString, type = typeof str;
    if (type !== 'string') {
      if (type === 'object') {
        if (str === null) {
          throw new Error(INPUT_ERROR);
        } else if (ARRAY_BUFFER && str.constructor === ArrayBuffer) {
          str = new Uint8Array(str);
        } else if (!Array.isArray(str)) {
          if (!ARRAY_BUFFER || !ArrayBuffer.isView(str)) {
            throw new Error(INPUT_ERROR);
          }
        }
      } else {
        throw new Error(INPUT_ERROR);
      }
      notString = true;
    }
    var bytes = 0, length = str.length;
    if (notString) {
      bytes = length;
    } else {
      for (var i = 0; i < str.length; ++i) {
        var code = str.charCodeAt(i);
        if (code < 0x80) {
          bytes += 1;
        } else if (code < 0x800) {
          bytes += 2;
        } else if (code < 0xd800 || code >= 0xe000) {
          bytes += 3;
        } else {
          code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(++i) & 0x3ff));
          bytes += 4;
        }
      }
    }
    bytes += this.encode(bytes * 8);
    this.update(str);
    return bytes;
  };

  Keccak.prototype.bytepad = function (strs, w) {
    var bytes = this.encode(w);
    for (var i = 0; i < strs.length; ++i) {
      bytes += this.encodeString(strs[i]);
    }
    var paddingBytes = w - bytes % w;
    var zeros = [];
    zeros.length = paddingBytes;
    this.update(zeros);
    return this;
  };

  Keccak.prototype.finalize = function () {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    var blocks = this.blocks, i = this.lastByteIndex, blockCount = this.blockCount, s = this.s;
    blocks[i >> 2] |= this.padding[i & 3];
    if (this.lastByteIndex === this.byteCount) {
      blocks[0] = blocks[blockCount];
      for (i = 1; i < blockCount + 1; ++i) {
        blocks[i] = 0;
      }
    }
    blocks[blockCount - 1] |= 0x80000000;
    for (i = 0; i < blockCount; ++i) {
      s[i] ^= blocks[i];
    }
    f(s);
  };

  Keccak.prototype.toString = Keccak.prototype.hex = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
      extraBytes = this.extraBytes, i = 0, j = 0;
    var hex = '', block;
    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        block = s[i];
        hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F] +
          HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F] +
          HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F] +
          HEX_CHARS[(block >> 28) & 0x0F] + HEX_CHARS[(block >> 24) & 0x0F];
      }
      if (j % blockCount === 0) {
        f(s);
        i = 0;
      }
    }
    if (extraBytes) {
      block = s[i];
      hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F];
      if (extraBytes > 1) {
        hex += HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F];
      }
      if (extraBytes > 2) {
        hex += HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F];
      }
    }
    return hex;
  };

  Keccak.prototype.arrayBuffer = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
      extraBytes = this.extraBytes, i = 0, j = 0;
    var bytes = this.outputBits >> 3;
    var buffer;
    if (extraBytes) {
      buffer = new ArrayBuffer((outputBlocks + 1) << 2);
    } else {
      buffer = new ArrayBuffer(bytes);
    }
    var array = new Uint32Array(buffer);
    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        array[j] = s[i];
      }
      if (j % blockCount === 0) {
        f(s);
      }
    }
    if (extraBytes) {
      array[i] = s[i];
      buffer = buffer.slice(0, bytes);
    }
    return buffer;
  };

  Keccak.prototype.buffer = Keccak.prototype.arrayBuffer;

  Keccak.prototype.digest = Keccak.prototype.array = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
      extraBytes = this.extraBytes, i = 0, j = 0;
    var array = [], offset, block;
    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        offset = j << 2;
        block = s[i];
        array[offset] = block & 0xFF;
        array[offset + 1] = (block >> 8) & 0xFF;
        array[offset + 2] = (block >> 16) & 0xFF;
        array[offset + 3] = (block >> 24) & 0xFF;
      }
      if (j % blockCount === 0) {
        f(s);
      }
    }
    if (extraBytes) {
      offset = j << 2;
      block = s[i];
      array[offset] = block & 0xFF;
      if (extraBytes > 1) {
        array[offset + 1] = (block >> 8) & 0xFF;
      }
      if (extraBytes > 2) {
        array[offset + 2] = (block >> 16) & 0xFF;
      }
    }
    return array;
  };

  function Kmac(bits, padding, outputBits) {
    Keccak.call(this, bits, padding, outputBits);
  }

  Kmac.prototype = new Keccak();

  Kmac.prototype.finalize = function () {
    this.encode(this.outputBits, true);
    return Keccak.prototype.finalize.call(this);
  };

  var f = function (s) {
    var h, l, n, c0, c1, c2, c3, c4, c5, c6, c7, c8, c9,
      b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17,
      b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30, b31, b32, b33,
      b34, b35, b36, b37, b38, b39, b40, b41, b42, b43, b44, b45, b46, b47, b48, b49;
    for (n = 0; n < 48; n += 2) {
      c0 = s[0] ^ s[10] ^ s[20] ^ s[30] ^ s[40];
      c1 = s[1] ^ s[11] ^ s[21] ^ s[31] ^ s[41];
      c2 = s[2] ^ s[12] ^ s[22] ^ s[32] ^ s[42];
      c3 = s[3] ^ s[13] ^ s[23] ^ s[33] ^ s[43];
      c4 = s[4] ^ s[14] ^ s[24] ^ s[34] ^ s[44];
      c5 = s[5] ^ s[15] ^ s[25] ^ s[35] ^ s[45];
      c6 = s[6] ^ s[16] ^ s[26] ^ s[36] ^ s[46];
      c7 = s[7] ^ s[17] ^ s[27] ^ s[37] ^ s[47];
      c8 = s[8] ^ s[18] ^ s[28] ^ s[38] ^ s[48];
      c9 = s[9] ^ s[19] ^ s[29] ^ s[39] ^ s[49];

      h = c8 ^ ((c2 << 1) | (c3 >>> 31));
      l = c9 ^ ((c3 << 1) | (c2 >>> 31));
      s[0] ^= h;
      s[1] ^= l;
      s[10] ^= h;
      s[11] ^= l;
      s[20] ^= h;
      s[21] ^= l;
      s[30] ^= h;
      s[31] ^= l;
      s[40] ^= h;
      s[41] ^= l;
      h = c0 ^ ((c4 << 1) | (c5 >>> 31));
      l = c1 ^ ((c5 << 1) | (c4 >>> 31));
      s[2] ^= h;
      s[3] ^= l;
      s[12] ^= h;
      s[13] ^= l;
      s[22] ^= h;
      s[23] ^= l;
      s[32] ^= h;
      s[33] ^= l;
      s[42] ^= h;
      s[43] ^= l;
      h = c2 ^ ((c6 << 1) | (c7 >>> 31));
      l = c3 ^ ((c7 << 1) | (c6 >>> 31));
      s[4] ^= h;
      s[5] ^= l;
      s[14] ^= h;
      s[15] ^= l;
      s[24] ^= h;
      s[25] ^= l;
      s[34] ^= h;
      s[35] ^= l;
      s[44] ^= h;
      s[45] ^= l;
      h = c4 ^ ((c8 << 1) | (c9 >>> 31));
      l = c5 ^ ((c9 << 1) | (c8 >>> 31));
      s[6] ^= h;
      s[7] ^= l;
      s[16] ^= h;
      s[17] ^= l;
      s[26] ^= h;
      s[27] ^= l;
      s[36] ^= h;
      s[37] ^= l;
      s[46] ^= h;
      s[47] ^= l;
      h = c6 ^ ((c0 << 1) | (c1 >>> 31));
      l = c7 ^ ((c1 << 1) | (c0 >>> 31));
      s[8] ^= h;
      s[9] ^= l;
      s[18] ^= h;
      s[19] ^= l;
      s[28] ^= h;
      s[29] ^= l;
      s[38] ^= h;
      s[39] ^= l;
      s[48] ^= h;
      s[49] ^= l;

      b0 = s[0];
      b1 = s[1];
      b32 = (s[11] << 4) | (s[10] >>> 28);
      b33 = (s[10] << 4) | (s[11] >>> 28);
      b14 = (s[20] << 3) | (s[21] >>> 29);
      b15 = (s[21] << 3) | (s[20] >>> 29);
      b46 = (s[31] << 9) | (s[30] >>> 23);
      b47 = (s[30] << 9) | (s[31] >>> 23);
      b28 = (s[40] << 18) | (s[41] >>> 14);
      b29 = (s[41] << 18) | (s[40] >>> 14);
      b20 = (s[2] << 1) | (s[3] >>> 31);
      b21 = (s[3] << 1) | (s[2] >>> 31);
      b2 = (s[13] << 12) | (s[12] >>> 20);
      b3 = (s[12] << 12) | (s[13] >>> 20);
      b34 = (s[22] << 10) | (s[23] >>> 22);
      b35 = (s[23] << 10) | (s[22] >>> 22);
      b16 = (s[33] << 13) | (s[32] >>> 19);
      b17 = (s[32] << 13) | (s[33] >>> 19);
      b48 = (s[42] << 2) | (s[43] >>> 30);
      b49 = (s[43] << 2) | (s[42] >>> 30);
      b40 = (s[5] << 30) | (s[4] >>> 2);
      b41 = (s[4] << 30) | (s[5] >>> 2);
      b22 = (s[14] << 6) | (s[15] >>> 26);
      b23 = (s[15] << 6) | (s[14] >>> 26);
      b4 = (s[25] << 11) | (s[24] >>> 21);
      b5 = (s[24] << 11) | (s[25] >>> 21);
      b36 = (s[34] << 15) | (s[35] >>> 17);
      b37 = (s[35] << 15) | (s[34] >>> 17);
      b18 = (s[45] << 29) | (s[44] >>> 3);
      b19 = (s[44] << 29) | (s[45] >>> 3);
      b10 = (s[6] << 28) | (s[7] >>> 4);
      b11 = (s[7] << 28) | (s[6] >>> 4);
      b42 = (s[17] << 23) | (s[16] >>> 9);
      b43 = (s[16] << 23) | (s[17] >>> 9);
      b24 = (s[26] << 25) | (s[27] >>> 7);
      b25 = (s[27] << 25) | (s[26] >>> 7);
      b6 = (s[36] << 21) | (s[37] >>> 11);
      b7 = (s[37] << 21) | (s[36] >>> 11);
      b38 = (s[47] << 24) | (s[46] >>> 8);
      b39 = (s[46] << 24) | (s[47] >>> 8);
      b30 = (s[8] << 27) | (s[9] >>> 5);
      b31 = (s[9] << 27) | (s[8] >>> 5);
      b12 = (s[18] << 20) | (s[19] >>> 12);
      b13 = (s[19] << 20) | (s[18] >>> 12);
      b44 = (s[29] << 7) | (s[28] >>> 25);
      b45 = (s[28] << 7) | (s[29] >>> 25);
      b26 = (s[38] << 8) | (s[39] >>> 24);
      b27 = (s[39] << 8) | (s[38] >>> 24);
      b8 = (s[48] << 14) | (s[49] >>> 18);
      b9 = (s[49] << 14) | (s[48] >>> 18);

      s[0] = b0 ^ (~b2 & b4);
      s[1] = b1 ^ (~b3 & b5);
      s[10] = b10 ^ (~b12 & b14);
      s[11] = b11 ^ (~b13 & b15);
      s[20] = b20 ^ (~b22 & b24);
      s[21] = b21 ^ (~b23 & b25);
      s[30] = b30 ^ (~b32 & b34);
      s[31] = b31 ^ (~b33 & b35);
      s[40] = b40 ^ (~b42 & b44);
      s[41] = b41 ^ (~b43 & b45);
      s[2] = b2 ^ (~b4 & b6);
      s[3] = b3 ^ (~b5 & b7);
      s[12] = b12 ^ (~b14 & b16);
      s[13] = b13 ^ (~b15 & b17);
      s[22] = b22 ^ (~b24 & b26);
      s[23] = b23 ^ (~b25 & b27);
      s[32] = b32 ^ (~b34 & b36);
      s[33] = b33 ^ (~b35 & b37);
      s[42] = b42 ^ (~b44 & b46);
      s[43] = b43 ^ (~b45 & b47);
      s[4] = b4 ^ (~b6 & b8);
      s[5] = b5 ^ (~b7 & b9);
      s[14] = b14 ^ (~b16 & b18);
      s[15] = b15 ^ (~b17 & b19);
      s[24] = b24 ^ (~b26 & b28);
      s[25] = b25 ^ (~b27 & b29);
      s[34] = b34 ^ (~b36 & b38);
      s[35] = b35 ^ (~b37 & b39);
      s[44] = b44 ^ (~b46 & b48);
      s[45] = b45 ^ (~b47 & b49);
      s[6] = b6 ^ (~b8 & b0);
      s[7] = b7 ^ (~b9 & b1);
      s[16] = b16 ^ (~b18 & b10);
      s[17] = b17 ^ (~b19 & b11);
      s[26] = b26 ^ (~b28 & b20);
      s[27] = b27 ^ (~b29 & b21);
      s[36] = b36 ^ (~b38 & b30);
      s[37] = b37 ^ (~b39 & b31);
      s[46] = b46 ^ (~b48 & b40);
      s[47] = b47 ^ (~b49 & b41);
      s[8] = b8 ^ (~b0 & b2);
      s[9] = b9 ^ (~b1 & b3);
      s[18] = b18 ^ (~b10 & b12);
      s[19] = b19 ^ (~b11 & b13);
      s[28] = b28 ^ (~b20 & b22);
      s[29] = b29 ^ (~b21 & b23);
      s[38] = b38 ^ (~b30 & b32);
      s[39] = b39 ^ (~b31 & b33);
      s[48] = b48 ^ (~b40 & b42);
      s[49] = b49 ^ (~b41 & b43);

      s[0] ^= RC[n];
      s[1] ^= RC[n + 1];
    }
  };

  if (COMMON_JS) {
    module.exports = methods;
  } else {
    for (i = 0; i < methodNames.length; ++i) {
      root[methodNames[i]] = methods[methodNames[i]];
    }
    if (AMD) {
      !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () {
        return methods;
      }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    }
  }
})();


/***/ }),

/***/ "./node_modules/minimalistic-assert/index.js":
/*!***************************************************!*\
  !*** ./node_modules/minimalistic-assert/index.js ***!
  \***************************************************/
/***/ ((module) => {

module.exports = assert;

function assert(val, msg) {
  if (!val)
    throw new Error(msg || 'Assertion failed');
}

assert.equal = function assertEqual(l, r, msg) {
  if (l != r)
    throw new Error(msg || ('Assertion failed: ' + l + ' != ' + r));
};


/***/ }),

/***/ "?8131":
/*!************************!*\
  !*** buffer (ignored) ***!
  \************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?decb":
/*!********************!*\
  !*** fs (ignored) ***!
  \********************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "./src/js/provider.js":
/*!****************************!*\
  !*** ./src/js/provider.js ***!
  \****************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Provider)
/* harmony export */ });
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
// const ethers = require('ethers');
// import { ethers } from 'ethers';
var Provider = /*#__PURE__*/function () {
  function Provider() {
    _classCallCheck(this, Provider);
  }
  _createClass(Provider, [{
    key: "blockchainConnection",
    value: function () {
      var _blockchainConnection = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
        var provider;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              // check if Metamask is installed.
              if (window.ethereum === null) {
                console.log('MetaMask not installed using read-only defaults');
                provider = ethers.getDefaultProvider();
              } else {
                // connect to Metamask wallet
                provider = new ethers.BrowserProvider(window.ethereum);
              }
              return _context.abrupt("return", provider);
            case 5:
              _context.prev = 5;
              _context.t0 = _context["catch"](0);
              console.log('Error in the network connection.');
              return _context.abrupt("return");
            case 9:
            case "end":
              return _context.stop();
          }
        }, _callee, null, [[0, 5]]);
      }));
      function blockchainConnection() {
        return _blockchainConnection.apply(this, arguments);
      }
      return blockchainConnection;
    }()
  }]);
  return Provider;
}();


/***/ }),

/***/ "./src/js/signer.js":
/*!**************************!*\
  !*** ./src/js/signer.js ***!
  \**************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Signer)
/* harmony export */ });
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var Signer = /*#__PURE__*/function () {
  function Signer() {
    _classCallCheck(this, Signer);
  }

  // process signer connection to ethers.js
  _createClass(Signer, [{
    key: "setSigner",
    value: function () {
      var _setSigner = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(provider) {
        var signer;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              signer = null;
              if (!(window.ethereum !== null && provider)) {
                _context.next = 7;
                break;
              }
              _context.next = 5;
              return provider.getSigner();
            case 5:
              signer = _context.sent;
              return _context.abrupt("return", signer);
            case 7:
              _context.next = 13;
              break;
            case 9:
              _context.prev = 9;
              _context.t0 = _context["catch"](0);
              console.log('Connection with signer failed');
              return _context.abrupt("return");
            case 13:
            case "end":
              return _context.stop();
          }
        }, _callee, null, [[0, 9]]);
      }));
      function setSigner(_x) {
        return _setSigner.apply(this, arguments);
      }
      return setSigner;
    }()
  }]);
  return Signer;
}();


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/amd options */
/******/ 	(() => {
/******/ 		__webpack_require__.amdO = {};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!***************************!*\
  !*** ./src/js/mintNFT.js ***!
  \***************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "App": () => (/* binding */ App)
/* harmony export */ });
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ "?decb");
/* harmony import */ var ethers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ethers */ "./node_modules/@ethersproject/contracts/lib.esm/index.js");
/* harmony import */ var ethers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ethers */ "./node_modules/@ethersproject/units/lib.esm/index.js");
/* harmony import */ var _provider_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./provider.js */ "./src/js/provider.js");
/* harmony import */ var _signer_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./signer.js */ "./src/js/signer.js");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
// import dotenv from 'dotenv';
// dotenv.config();





// app class to process main functions from the system
var App = /*#__PURE__*/function () {
  function App() {
    _classCallCheck(this, App);
    // get elements from html
    this.form = document.getElementById('form');
    this.toWalletAddress = document.getElementById('toWalletAddress');
    this.amount = document.getElementById('amount');
    this.connectBtn = document.getElementById('connect-btn');
    this.fromWalletAddressSpan = document.getElementById('fromWalletAddressSpan');
    //declare signer variable to be used under "this" context.
    this.signer;
  }
  _createClass(App, [{
    key: "runApp",
    value: function () {
      var _runApp = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
        var _this = this;
        var contractAddress, contractABI, _provider, _contractInstance, accounts;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              _context2.next = 3;
              return this.isConnected();
            case 3:
              this.connectBtn.onclick = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
                return _regeneratorRuntime().wrap(function _callee$(_context) {
                  while (1) switch (_context.prev = _context.next) {
                    case 0:
                      _context.next = 2;
                      return _this.signerConnection();
                    case 2:
                      _context.next = 4;
                      return _this.isConnected();
                    case 4:
                    case "end":
                      return _context.stop();
                  }
                }, _callee);
              }));
              if (!this.isConnected) {
                _context2.next = 11;
                break;
              }
              // const privateKey = process.env.PTIVATE_KEY;
              contractAddress = "0xe5bc976a5d2713eD2E17f36EF7B30232748409Bd";
              contractABI = fs__WEBPACK_IMPORTED_MODULE_0__.readFileSync('../src/contracts/AIImgNFT.sol/AIImgNFT.json').toString();
              _context2.next = 9;
              return this.providerConnection();
            case 9:
              _provider = _context2.sent;
              _contractInstance = new ethers__WEBPACK_IMPORTED_MODULE_3__.Contract(contractAddress, contractABI, _provider);
            case 11:
              _context2.next = 13;
              return ethereum.request({
                method: 'eth_accounts'
              });
            case 13:
              accounts = _context2.sent;
              this.mintNFT(this.signer.address, 'ipfs://bafybeifi4yeo4zt56u5uya3u3ktgm6yb77yfl7lqelaimb3szovblq2qo4/1687703139655.json', contractInstance);
              _context2.next = 19;
              break;
            case 17:
              _context2.prev = 17;
              _context2.t0 = _context2["catch"](0);
            case 19:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[0, 17]]);
      }));
      function runApp() {
        return _runApp.apply(this, arguments);
      }
      return runApp;
    }()
  }, {
    key: "mintNFT",
    value: function () {
      var _mintNFT = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(address, URI, contractInstance) {
        var nonce, gasFee, rawTxn, signedTxn, reciept;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              _context3.next = 3;
              return this.getNonce(this.signer.address);
            case 3:
              nonce = _context3.sent;
              _context3.next = 6;
              return this.getGasPrice(provider);
            case 6:
              gasFee = _context3.sent;
              _context3.next = 9;
              return contractInstance.populateTransaction.safeMint(address, URI, {
                gasPrice: gasFee,
                nonce: nonce
              });
            case 9:
              rawTxn = _context3.sent;
              console.log('...Submitting transaction with gas price of:', ethers__WEBPACK_IMPORTED_MODULE_4__.formatUnits(gasFee, 'gwei'), ' - & nonce:', nonce);
              _context3.next = 13;
              return this.signer.sendTransaction(rawTxn);
            case 13:
              signedTxn = _context3.sent;
              _context3.next = 16;
              return signedTxn;
            case 16:
              reciept = _context3.sent.wait();
              if (!reciept) {
                _context3.next = 38;
                break;
              }
              _context3.t0 = console;
              _context3.t1 = 'Transaction is successful!!!' + '\n' + 'Transaction Hash:';
              _context3.next = 22;
              return signedTxn;
            case 22:
              _context3.t2 = _context3.sent.hash;
              _context3.t3 = _context3.t2 + '\n';
              _context3.t4 = _context3.t3 + 'Block Number: ';
              _context3.next = 27;
              return reciept;
            case 27:
              _context3.t5 = _context3.sent.blockNumber;
              _context3.t6 = _context3.t4 + _context3.t5;
              _context3.t7 = _context3.t6 + '\n';
              _context3.t8 = _context3.t7 + 'Navigate to https://polygonscan.com/tx/';
              _context3.next = 33;
              return signedTxn;
            case 33:
              _context3.t9 = _context3.sent.hash;
              _context3.t10 = _context3.t8 + _context3.t9;
              _context3.t0.log.call(_context3.t0, _context3.t1, _context3.t10, 'to see your transaction');
              _context3.next = 39;
              break;
            case 38:
              console.log('Error submitting transaction');
            case 39:
              _context3.next = 44;
              break;
            case 41:
              _context3.prev = 41;
              _context3.t11 = _context3["catch"](0);
              console.log('Error Caught in Catch Statement: ', _context3.t11);
            case 44:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[0, 41]]);
      }));
      function mintNFT(_x, _x2, _x3) {
        return _mintNFT.apply(this, arguments);
      }
      return mintNFT;
    }()
  }, {
    key: "isConnected",
    value: function () {
      var _isConnected = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
        var accounts, cutWallet, spanConnectedWallet;
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return ethereum.request({
                method: 'eth_accounts'
              });
            case 2:
              accounts = _context4.sent;
              if (!accounts.length) {
                _context4.next = 12;
                break;
              }
              cutWallet = accounts[0].slice(35);
              spanConnectedWallet = document.createElement('span');
              this.connectBtn.parentElement.appendChild(spanConnectedWallet);
              spanConnectedWallet.innerText = "Connected with ...".concat(cutWallet);
              this.connectBtn.style.visibility = 'hidden';
              this.fromWalletAddressSpan.innerText = accounts[0];
              _context4.next = 12;
              return this.signerConnection();
            case 12:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this);
      }));
      function isConnected() {
        return _isConnected.apply(this, arguments);
      }
      return isConnected;
    }()
  }, {
    key: "providerConnection",
    value: function () {
      var _providerConnection = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
        var provider, providerConnected;
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              // Connection to the provider
              provider = new _provider_js__WEBPACK_IMPORTED_MODULE_1__["default"]();
              console.log("Provider: ".concat(provider));
              _context5.next = 4;
              return provider.blockchainConnection();
            case 4:
              providerConnected = _context5.sent;
              return _context5.abrupt("return", providerConnected);
            case 6:
            case "end":
              return _context5.stop();
          }
        }, _callee5);
      }));
      function providerConnection() {
        return _providerConnection.apply(this, arguments);
      }
      return providerConnection;
    }() // method to connect signer
  }, {
    key: "signerConnection",
    value: function () {
      var _signerConnection = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
        var providerConnected, signerInstance;
        return _regeneratorRuntime().wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return this.providerConnection();
            case 2:
              providerConnected = _context6.sent;
              // connection to signer
              signerInstance = new _signer_js__WEBPACK_IMPORTED_MODULE_2__["default"]();
              _context6.next = 6;
              return signerInstance.setSigner(providerConnected);
            case 6:
              this.signer = _context6.sent;
            case 7:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this);
      }));
      function signerConnection() {
        return _signerConnection.apply(this, arguments);
      }
      return signerConnection;
    }()
  }, {
    key: "getGasPrice",
    value: function () {
      var _getGasPrice = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(provider) {
        var feeData;
        return _regeneratorRuntime().wrap(function _callee7$(_context7) {
          while (1) switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return provider.getGasPrice();
            case 2:
              feeData = _context7.sent.toNumber();
              return _context7.abrupt("return", feeData);
            case 4:
            case "end":
              return _context7.stop();
          }
        }, _callee7);
      }));
      function getGasPrice(_x4) {
        return _getGasPrice.apply(this, arguments);
      }
      return getGasPrice;
    }()
  }, {
    key: "getNonce",
    value: function () {
      var _getNonce = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(address) {
        var nonce;
        return _regeneratorRuntime().wrap(function _callee8$(_context8) {
          while (1) switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return this.signer.getTransactionCount(address);
            case 2:
              nonce = _context8.sent;
              return _context8.abrupt("return", nonce);
            case 4:
            case "end":
              return _context8.stop();
          }
        }, _callee8, this);
      }));
      function getNonce(_x5) {
        return _getNonce.apply(this, arguments);
      }
      return getNonce;
    }() // method to call internal methods in the correct order to process the app.
    // it checks if wallet is connected, listen submit button and process all
    // methods to connect wallet and process transaction
    //   async runApp() {
    //     try {
    //       await this.isConnected();
    //       this.connectBtn.onclick = async () => {
    //         await this.signerConnection();
    //         await this.isConnected();
    //       };
    //       this.form.addEventListener('submit', async (event) => {
    //         event.preventDefault();
    //         await this.transactionProcessing(this.signer);
    //       });
    //     } catch (err) {
    //       console.log(err.message);
    //     }
    //   }
    //   // method to check the connection of Metamask with the site
    //   async isConnected() {
    //     const accounts = await ethereum.request({ method: 'eth_accounts' });
    //     if (accounts.length) {
    //       const cutWallet = accounts[0].slice(35);
    //       const spanConnectedWallet = document.createElement('span');
    //       this.connectBtn.parentElement.appendChild(spanConnectedWallet);
    //       spanConnectedWallet.innerText = `Connected with ...${cutWallet}`;
    //       this.connectBtn.style.visibility = 'hidden';
    //       this.fromWalletAddressSpan.innerText = accounts[0];
    //       await this.signerConnection();
    //     }
    //   }
    //   // method to connect signer
    //   async signerConnection() {
    //     // Connection to the provider
    //     const provider = new Provider();
    //     console.log(`Provider: ${provider}`);
    //     const providerConnected = await provider.blockchainConnection();
    //     // connection to signer
    //     const signerInstance = new Signer();
    //     this.signer = await signerInstance.setSigner(providerConnected);
    //   }
    //   // this method is responsible to process the transaction and teturn the
    //   // response from blockchain
    //   async transactionProcessing(signer) {
    //     const toWalletAddress = this.toWalletAddress.value;
    //     const transactionAmount = this.amount.value;
    //     try {
    //       if (toWalletAddress && transactionAmount) {
    //         const validateFormData = new ValidateFormData(
    //           toWalletAddress,
    //           transactionAmount,
    //         );
    //         const isFormDataValid = validateFormData.validateData();
    //         if (!signer) {
    //           window.alert('Metamask is not connected');
    //           return;
    //         }
    //         if (isFormDataValid) {
    //           const tx = new Transaction(
    //             signer,
    //             toWalletAddress,
    //             transactionAmount,
    //           );
    //           const transaction = await tx.createTransaction();
    //           console.log(transaction);
    //           // Wait for the transaction to be written in the blockchain
    //           const receipt = await transaction.wait();
    //           console.log(receipt);
    //         }
    //       } else {
    //         window.alert('Dados inválidos.');
    //       }
    //     } catch (err) {
    //       console.log(err.message);
    //     }
    //   }
  }]);
  return App;
}();
var app = new App();
app.runApp();
})();

/******/ })()
;
//# sourceMappingURL=bundle.js.map
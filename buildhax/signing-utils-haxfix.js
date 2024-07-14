"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeSig = exports.verifySignatureWithoutPrefix = exports.verifyEIP712TypedDataSigner = exports.recoverMessageSigner = exports.getSignerFromTxEIP2718TX = exports.recoverTransaction = exports.extractSignature = exports.encodeTransaction = exports.isPriceToLow = exports.rlpEncodedTx = exports.stringNumberOrBNToHex = exports.getHashFromEncoded = exports.chainIdTransformationForSigning = exports.thirtyTwo = exports.sixtyFour = exports.publicKeyPrefix = void 0;
const address_1 = require("@celo/base/lib/address");
const connect_1 = require("@celo/connect");
const formatter_1 = require("@celo/connect/lib/utils/formatter");
const sign_typed_data_utils_1 = require("@celo/utils/lib/sign-typed-data-utils");
const signatureUtils_1 = require("@celo/utils/lib/signatureUtils");
// @ts-ignore-next-line
const ethUtil = __importStar(require("@ethereumjs/util"));
const debug_1 = __importDefault(require("debug"));
// @ts-ignore-next-line eth-lib types not found
const eth_lib_1 = require("eth-lib");
const keccak_1 = require("ethereum-cryptography/keccak");
const utils_js_1 = require("ethereum-cryptography/utils.js");
const web3_1 = __importDefault(require("web3")); // TODO try to do this without web3 direct
const web3_eth_accounts_1 = __importDefault(require("web3-eth-accounts"));
const { Address, ecrecover, fromRpcSig, hashPersonalMessage, pubToAddress, toBuffer, toChecksumAddress, } = ethUtil;
const debug = (0, debug_1.default)('wallet-base:tx:sign');
// Original code taken from
// https://github.com/ethereum/web3.js/blob/1.x/packages/web3-eth-accounts/src/index.js
// 0x04 prefix indicates that the key is not compressed
// https://tools.ietf.org/html/rfc5480#section-2.2
exports.publicKeyPrefix = 0x04;
exports.sixtyFour = 64;
exports.thirtyTwo = 32;
const Y_PARITY_EIP_2098 = 27;
function isNullOrUndefined(value) {
    return value === null || value === undefined;
}
// Simple replay attack protection
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
function chainIdTransformationForSigning(chainId) {
    return chainId * 2 + 35;
}
exports.chainIdTransformationForSigning = chainIdTransformationForSigning;
function getHashFromEncoded(rlpEncode) {
    return eth_lib_1.hash.keccak256(rlpEncode);
}
exports.getHashFromEncoded = getHashFromEncoded;
function trimLeadingZero(hex) {
    while (hex && hex.startsWith('0x0')) {
        hex = (0, address_1.ensureLeading0x)(hex.slice(3));
    }
    return hex;
}
function makeEven(hex) {
    if (hex.length % 2 === 1) {
        hex = hex.replace('0x', '0x0');
    }
    return hex;
}
function signatureFormatter(signature, type) {
    let v = signature.v;
    if (type !== 'celo-legacy' && type !== 'ethereum-legacy') {
        v = signature.v === Y_PARITY_EIP_2098 ? 0 : 1;
    }
    return {
        v: stringNumberToHex(v),
        r: makeEven(trimLeadingZero((0, address_1.ensureLeading0x)(signature.r.toString('hex')))),
        s: makeEven(trimLeadingZero((0, address_1.ensureLeading0x)(signature.s.toString('hex')))),
    };
}
function stringNumberOrBNToHex(num) {
    if (typeof num === 'string' || typeof num === 'number' || num === undefined) {
        return stringNumberToHex(num);
    }
    else {
        return makeEven(`0x` + num.toString(16));
    }
}
exports.stringNumberOrBNToHex = stringNumberOrBNToHex;
function stringNumberToHex(num) {
    const auxNumber = Number(num);
    if (num === '0x' || num === undefined || auxNumber === 0) {
        return '0x';
    }
    return makeEven(web3_1.default.utils.numberToHex(num));
}
function rlpEncodedTx(tx) {
    assertSerializableTX(tx);
    const transaction = (0, formatter_1.inputCeloTxFormatter)(tx);
    transaction.to = eth_lib_1.bytes.fromNat(tx.to || '0x').toLowerCase();
    transaction.nonce = Number((tx.nonce !== '0x' ? tx.nonce : 0) || 0);
    transaction.data = eth_lib_1.bytes.fromNat(tx.data || '0x').toLowerCase();
    transaction.value = stringNumberOrBNToHex(tx.value);
    transaction.gas = stringNumberOrBNToHex(tx.gas);
    transaction.chainId = tx.chainId || 1;
    // Celo Specific
    transaction.feeCurrency = eth_lib_1.bytes.fromNat(tx.feeCurrency || '0x').toLowerCase();
    transaction.gatewayFeeRecipient = eth_lib_1.bytes.fromNat(tx.gatewayFeeRecipient || '0x').toLowerCase();
    transaction.gatewayFee = stringNumberOrBNToHex(tx.gatewayFee);
    // Legacy
    transaction.gasPrice = stringNumberOrBNToHex(tx.gasPrice);
    // EIP1559 / CIP42
    transaction.maxFeePerGas = stringNumberOrBNToHex(tx.maxFeePerGas);
    transaction.maxPriorityFeePerGas = stringNumberOrBNToHex(tx.maxPriorityFeePerGas);
    let rlpEncode;
    if (isCIP64(tx)) {
        // https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0064.md
        // 0x7b || rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, feeCurrency, signatureYParity, signatureR, signatureS]).
        rlpEncode = eth_lib_1.RLP.encode([
            stringNumberToHex(transaction.chainId),
            stringNumberToHex(transaction.nonce),
            transaction.maxPriorityFeePerGas || '0x',
            transaction.maxFeePerGas || '0x',
            transaction.gas || '0x',
            transaction.to || '0x',
            transaction.value || '0x',
            transaction.data || '0x',
            transaction.accessList || [],
            transaction.feeCurrency || '0x',
        ]);
        delete transaction.gatewayFee;
        delete transaction.gatewayFeeRecipient;
        delete transaction.gasPrice;
        return { transaction, rlpEncode: concatHex([TxTypeToPrefix.cip64, rlpEncode]), type: 'cip64' };
    }
    else if (isCIP42(tx)) {
        // There shall be a typed transaction with the code 0x7c that has the following format:
        // 0x7c || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, feecurrency, gatewayFeeRecipient, gatewayfee, destination, amount, data, access_list, signature_y_parity, signature_r, signature_s]).
        // This will be in addition to the type 0x02 transaction as specified in EIP-1559.
        rlpEncode = eth_lib_1.RLP.encode([
            stringNumberToHex(transaction.chainId),
            stringNumberToHex(transaction.nonce),
            transaction.maxPriorityFeePerGas || '0x',
            transaction.maxFeePerGas || '0x',
            transaction.gas || '0x',
            transaction.feeCurrency || '0x',
            "0x",
            "0x",
            transaction.to || '0x',
            transaction.value || '0x',
            transaction.data || '0x',
            transaction.accessList || [],
        ]);
        delete transaction.gasPrice;
        return { transaction, rlpEncode: concatHex([TxTypeToPrefix.cip42, rlpEncode]), type: 'cip42' };
    }
    else if (isEIP1559(tx)) {
        // https://eips.ethereum.org/EIPS/eip-1559
        // 0x02 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, amount, data, access_list, signature_y_parity, signature_r, signature_s]).
        rlpEncode = eth_lib_1.RLP.encode([
            stringNumberToHex(transaction.chainId),
            stringNumberToHex(transaction.nonce),
            transaction.maxPriorityFeePerGas || '0x',
            transaction.maxFeePerGas || '0x',
            transaction.gas || '0x',
            transaction.to || '0x',
            transaction.value || '0x',
            transaction.data || '0x',
            transaction.accessList || [],
        ]);
        delete transaction.feeCurrency;
        delete transaction.gatewayFee;
        delete transaction.gatewayFeeRecipient;
        delete transaction.gasPrice;
        return {
            transaction,
            rlpEncode: concatHex([TxTypeToPrefix.eip1559, rlpEncode]),
            type: 'eip1559',
        };
    }
    else if (isCeloLegacy(tx)) {
        // This order should match the order in Geth.
        // https://github.com/celo-org/celo-blockchain/blob/027dba2e4584936cc5a8e8993e4e27d28d5247b8/core/types/transaction.go#L65
        rlpEncode = eth_lib_1.RLP.encode([
            stringNumberToHex(transaction.nonce),
            transaction.gasPrice,
            transaction.gas,
            transaction.feeCurrency,
            "0x",
            "0x",
            transaction.to,
            transaction.value,
            transaction.data,
            stringNumberToHex(transaction.chainId),
            '0x',
            '0x',
        ]);
        return { transaction, rlpEncode, type: 'celo-legacy' };
    }
    else {
        // https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0035.md
        // rlp([nonce, gasprice, gaslimit, recipient, amount, data, v, r, s])
        rlpEncode = eth_lib_1.RLP.encode([
            stringNumberToHex(transaction.nonce),
            transaction.gasPrice,
            transaction.gas,
            transaction.to,
            transaction.value,
            transaction.data,
            stringNumberToHex(transaction.chainId),
            '0x',
            '0x',
        ]);
        delete transaction.feeCurrency;
        delete transaction.gatewayFee;
        delete transaction.gatewayFeeRecipient;
        return { transaction, rlpEncode, type: 'ethereum-legacy' };
    }
}
exports.rlpEncodedTx = rlpEncodedTx;
var TxTypeToPrefix;
(function (TxTypeToPrefix) {
    TxTypeToPrefix["ethereum-legacy"] = "";
    TxTypeToPrefix["celo-legacy"] = "";
    TxTypeToPrefix["cip42"] = "0x7c";
    TxTypeToPrefix["cip64"] = "0x7b";
    TxTypeToPrefix["eip1559"] = "0x02";
})(TxTypeToPrefix || (TxTypeToPrefix = {}));
function concatTypePrefixHex(rawTransaction, txType) {
    const prefix = TxTypeToPrefix[txType];
    if (prefix) {
        return concatHex([prefix, rawTransaction]);
    }
    return rawTransaction;
}
function assertSerializableTX(tx) {
    if (!tx.gas) {
        throw new Error('"gas" is missing');
    }
    // ensure at least gasPrice or maxFeePerGas and maxPriorityFeePerGas are set
    if (!(0, connect_1.isPresent)(tx.gasPrice) &&
        (!(0, connect_1.isPresent)(tx.maxFeePerGas) || !(0, connect_1.isPresent)(tx.maxPriorityFeePerGas))) {
        throw new Error('"gasPrice" or "maxFeePerGas" and "maxPriorityFeePerGas" are missing');
    }
    // ensure that gasPrice and maxFeePerGas are not set at the same time
    if ((0, connect_1.isPresent)(tx.gasPrice) &&
        ((0, connect_1.isPresent)(tx.maxFeePerGas) || (0, connect_1.isPresent)(tx.maxPriorityFeePerGas))) {
        throw new Error('when "maxFeePerGas" or "maxPriorityFeePerGas" are set, "gasPrice" must not be set');
    }
    if (isNullOrUndefined(tx.nonce) || isNullOrUndefined(tx.chainId)) {
        throw new Error('One of the values "chainId" or "nonce" couldn\'t be fetched: ' +
            JSON.stringify({ chainId: tx.chainId, nonce: tx.nonce }));
    }
    if (isLessThanZero(tx.nonce) || isLessThanZero(tx.gas) || isLessThanZero(tx.chainId)) {
        throw new Error('Gas, nonce or chainId is less than than 0');
    }
    isPriceToLow(tx);
}
function isPriceToLow(tx) {
    const prices = [tx.gasPrice, tx.maxFeePerGas, tx.maxPriorityFeePerGas].filter((price) => price !== undefined);
    const isLow = false;
    for (const price of prices) {
        if (isLessThanZero(price)) {
            throw new Error('GasPrice or maxFeePerGas or maxPriorityFeePerGas is less than than 0');
        }
    }
    return isLow;
}
exports.isPriceToLow = isPriceToLow;
function isEIP1559(tx) {
    return (0, connect_1.isPresent)(tx.maxFeePerGas) && (0, connect_1.isPresent)(tx.maxPriorityFeePerGas);
}
function isCIP64(tx) {
    return (isEIP1559(tx) &&
        (0, connect_1.isPresent)(tx.feeCurrency) &&
        !(0, connect_1.isPresent)(tx.gatewayFee) &&
        !(0, connect_1.isPresent)(tx.gatewayFeeRecipient));
}
function isCIP42(tx) {
    return (isEIP1559(tx) &&
        ((0, connect_1.isPresent)(tx.feeCurrency) || (0, connect_1.isPresent)(tx.gatewayFeeRecipient) || (0, connect_1.isPresent)(tx.gatewayFee)));
}
function isCeloLegacy(tx) {
    return (!isEIP1559(tx) &&
        ((0, connect_1.isPresent)(tx.feeCurrency) || (0, connect_1.isPresent)(tx.gatewayFeeRecipient) || (0, connect_1.isPresent)(tx.gatewayFee)));
}
function concatHex(values) {
    return `0x${values.reduce((acc, x) => acc + x.replace('0x', ''), '')}`;
}
function isLessThanZero(value) {
    if (isNullOrUndefined(value)) {
        return true;
    }
    switch (typeof value) {
        case 'string':
        case 'number':
            return Number(value) < 0;
        default:
            return (value === null || value === void 0 ? void 0 : value.lt(web3_1.default.utils.toBN(0))) || false;
    }
}
function encodeTransaction(rlpEncoded, signature) {
    return __awaiter(this, void 0, void 0, function* () {
        const sanitizedSignature = signatureFormatter(signature, rlpEncoded.type);
        const v = sanitizedSignature.v;
        const r = sanitizedSignature.r;
        const s = sanitizedSignature.s;
        const decodedTX = prefixAwareRLPDecode(rlpEncoded.rlpEncode, rlpEncoded.type);
        let decodedFields;
        // for legacy tx we need to slice but for new ones we do not want to do that
        if (rlpEncoded.type == 'celo-legacy') {
            decodedFields = decodedTX.slice(0, 9);
        }
        else if (rlpEncoded.type == 'ethereum-legacy') {
            decodedFields = decodedTX.slice(0, 6);
        }
        else {
            decodedFields = decodedTX;
        }
        const rawTx = decodedFields.concat([v, r, s]);
        // After signing, the transaction is encoded again and type prefix added
        const rawTransaction = concatTypePrefixHex(eth_lib_1.RLP.encode(rawTx), rlpEncoded.type);
        const hash = getHashFromEncoded(rawTransaction);
        const baseTX = {
            nonce: rlpEncoded.transaction.nonce.toString(),
            gas: rlpEncoded.transaction.gas.toString(),
            to: rlpEncoded.transaction.to.toString(),
            value: rlpEncoded.transaction.value.toString(),
            input: rlpEncoded.transaction.data,
            v,
            r,
            s,
            hash,
        };
        let tx = baseTX;
        if (rlpEncoded.type === 'eip1559' || rlpEncoded.type === 'cip42') {
            tx = Object.assign(Object.assign({}, tx), {
                // @ts-expect-error -- just a matter of how  this tx is built
                maxFeePerGas: rlpEncoded.transaction.maxFeePerGas.toString(), maxPriorityFeePerGas: rlpEncoded.transaction.maxPriorityFeePerGas.toString(), accessList: (0, formatter_1.parseAccessList)(rlpEncoded.transaction.accessList || []) });
        }
        if (rlpEncoded.type === 'cip42' || rlpEncoded.type === 'celo-legacy') {
            tx = Object.assign(Object.assign({}, tx), {
                // @ts-expect-error -- just a matter of how  this tx is built
                feeCurrency: rlpEncoded.transaction.feeCurrency.toString(), gatewayFeeRecipient: rlpEncoded.transaction.gatewayFeeRecipient.toString(), gatewayFee: rlpEncoded.transaction.gatewayFee.toString() });
        }
        if (rlpEncoded.type === 'celo-legacy' || rlpEncoded.type === 'ethereum-legacy') {
            tx = Object.assign(Object.assign({}, tx), {
                // @ts-expect-error -- just a matter of how  this tx is built
                gasPrice: rlpEncoded.transaction.gasPrice.toString() });
        }
        const result = {
            tx: tx,
            raw: rawTransaction,
            type: rlpEncoded.type,
        };
        return result;
    });
}
exports.encodeTransaction = encodeTransaction;
// new types have prefix but legacy does not
function prefixAwareRLPDecode(rlpEncode, type) {
    if (type === 'celo-legacy' || type === 'ethereum-legacy') {
        return eth_lib_1.RLP.decode(rlpEncode);
    }
    return eth_lib_1.RLP.decode(`0x${rlpEncode.slice(4)}`);
}
function correctLengthOf(type, includeSig = true) {
    switch (type) {
        case 'cip64': {
            return includeSig ? 13 : 10;
        }
        case 'cip42':
            return includeSig ? 15 : 12;
        case 'ethereum-legacy':
            return 9;
        case 'celo-legacy':
        case 'eip1559':
            return 12;
    }
}
// Based on the return type of ensureLeading0x this was not a Buffer
function extractSignature(rawTx) {
    const type = determineTXType(rawTx);
    const rawValues = prefixAwareRLPDecode(rawTx, type);
    const length = rawValues.length;
    if (correctLengthOf(type) !== length) {
        throw new Error(`@extractSignature: provided transaction has ${length} elements but ${type} txs with a signature have ${correctLengthOf(type)} ${JSON.stringify(rawValues)}`);
    }
    return extractSignatureFromDecoded(rawValues);
}
exports.extractSignature = extractSignature;
function extractSignatureFromDecoded(rawValues) {
    // signature is always (for the tx we support so far) the last three elements of the array in order v, r, s,
    const v = rawValues.at(-3);
    let r = rawValues.at(-2);
    let s = rawValues.at(-1);
    // https://github.com/wagmi-dev/viem/blob/993321689b3e2220976504e7e170fe47731297ce/src/utils/transaction/parseTransaction.ts#L281
    // Account.recover cannot handle canonicalized signatures
    // A canonicalized signature may have the first byte removed if its value is 0
    r = (0, address_1.ensureLeading0x)((0, address_1.trimLeading0x)(r).padStart(64, '0'));
    s = (0, address_1.ensureLeading0x)((0, address_1.trimLeading0x)(s).padStart(64, '0'));
    return {
        v,
        r,
        s,
    };
}
// Recover transaction and sender address from a raw transaction.
// This is used for testing.
function recoverTransaction(rawTx) {
    if (!rawTx.startsWith('0x')) {
        throw new Error('rawTx must start with 0x');
    }
    switch (determineTXType(rawTx)) {
        case 'cip64':
            return recoverTransactionCIP64(rawTx);
        case 'cip42':
            return recoverTransactionCIP42(rawTx);
        case 'eip1559':
            return recoverTransactionEIP1559(rawTx);
        case 'celo-legacy':
            return recoverCeloLegacy(rawTx);
        default:
            return recoverEthereumLegacy(rawTx);
    }
}
exports.recoverTransaction = recoverTransaction;
// inspired by @ethereumjs/tx
function getPublicKeyofSignerFromTx(transactionArray, type) {
    // this needs to be 10 for cip64, 12 for cip42 and eip1559
    const base = transactionArray.slice(0, correctLengthOf(type, false));
    const message = concatHex([TxTypeToPrefix[type], eth_lib_1.RLP.encode(base).slice(2)]);
    const msgHash = (0, keccak_1.keccak256)((0, utils_js_1.hexToBytes)(message));
    const { v, r, s } = extractSignatureFromDecoded(transactionArray);
    try {
        return ecrecover(toBuffer(msgHash), v === '0x' || v === undefined ? BigInt(0) : BigInt(1), toBuffer(r), toBuffer(s));
    }
    catch (e) {
        throw new Error(e);
    }
}
function getSignerFromTxEIP2718TX(serializedTransaction) {
    const transactionArray = eth_lib_1.RLP.decode(`0x${serializedTransaction.slice(4)}`);
    const signer = getPublicKeyofSignerFromTx(transactionArray, determineTXType(serializedTransaction));
    return toChecksumAddress(Address.fromPublicKey(signer).toString());
}
exports.getSignerFromTxEIP2718TX = getSignerFromTxEIP2718TX;
function determineTXType(serializedTransaction) {
    const prefix = serializedTransaction.slice(0, 4);
    if (prefix === TxTypeToPrefix.eip1559) {
        return 'eip1559';
    }
    else if (prefix === TxTypeToPrefix.cip42) {
        return 'cip42';
    }
    else if (prefix === TxTypeToPrefix.cip64) {
        return 'cip64';
    }
    // it is one of the legacy types (Celo or Ethereum), to differentiate between
    // legacy tx types we have to check the numberof fields
    const rawValues = eth_lib_1.RLP.decode(serializedTransaction);
    const length = rawValues.length;
    return correctLengthOf('celo-legacy') === length ? 'celo-legacy' : 'ethereum-legacy';
}
function vrsForRecovery(vRaw, r, s) {
    const v = vRaw === '0x' || (0, formatter_1.hexToNumber)(vRaw) === 0 ? Y_PARITY_EIP_2098 : Y_PARITY_EIP_2098 + 1;
    return {
        v,
        r,
        s,
        yParity: v === Y_PARITY_EIP_2098 ? 0 : 1,
    };
}
function recoverTransactionCIP42(serializedTransaction) {
    const transactionArray = prefixAwareRLPDecode(serializedTransaction, 'cip42');
    debug('signing-utils@recoverTransactionCIP42: values are %s', transactionArray);
    if (transactionArray.length !== 15 && transactionArray.length !== 12) {
        throw new Error(`Invalid transaction length for type CIP42: ${transactionArray.length} instead of 15 or 12. array: ${transactionArray}`);
    }
    const [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, feeCurrency, gatewayFeeRecipient, gatewayFee, to, value, data, accessList, vRaw, r, s,] = transactionArray;
    const celoTX = Object.assign({ type: 'cip42', nonce: nonce.toLowerCase() === '0x' ? 0 : parseInt(nonce, 16), maxPriorityFeePerGas: maxPriorityFeePerGas.toLowerCase() === '0x' ? 0 : parseInt(maxPriorityFeePerGas, 16), maxFeePerGas: maxFeePerGas.toLowerCase() === '0x' ? 0 : parseInt(maxFeePerGas, 16), gas: gas.toLowerCase() === '0x' ? 0 : parseInt(gas, 16), feeCurrency,
        gatewayFeeRecipient,
        gatewayFee,
        to, value: value.toLowerCase() === '0x' ? 0 : parseInt(value, 16), data, chainId: chainId.toLowerCase() === '0x' ? 0 : parseInt(chainId, 16), accessList: (0, formatter_1.parseAccessList)(accessList) }, vrsForRecovery(vRaw, r, s));
    const signer = transactionArray.length === 15 ? getSignerFromTxEIP2718TX(serializedTransaction) : 'unsigned';
    return [celoTX, signer];
}
function recoverTransactionCIP64(serializedTransaction) {
    const transactionArray = prefixAwareRLPDecode(serializedTransaction, 'cip64');
    debug('signing-utils@recoverTransactionCIP64: values are %s', transactionArray);
    if (transactionArray.length !== 13 && transactionArray.length !== 10) {
        throw new Error(`Invalid transaction length for type CIP64: ${transactionArray.length} instead of 13 or 10. array: ${transactionArray}`);
    }
    const [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList, feeCurrency, vRaw, r, s,] = transactionArray;
    const celoTX = Object.assign({ type: 'cip64', nonce: nonce.toLowerCase() === '0x' ? 0 : parseInt(nonce, 16), maxPriorityFeePerGas: maxPriorityFeePerGas.toLowerCase() === '0x' ? 0 : parseInt(maxPriorityFeePerGas, 16), maxFeePerGas: maxFeePerGas.toLowerCase() === '0x' ? 0 : parseInt(maxFeePerGas, 16), gas: gas.toLowerCase() === '0x' ? 0 : parseInt(gas, 16), feeCurrency,
        to, value: value.toLowerCase() === '0x' ? 0 : parseInt(value, 16), data, chainId: chainId.toLowerCase() === '0x' ? 0 : parseInt(chainId, 16), accessList: (0, formatter_1.parseAccessList)(accessList) }, vrsForRecovery(vRaw, r, s));
    const signer = transactionArray.length === 13 ? getSignerFromTxEIP2718TX(serializedTransaction) : 'unsigned';
    return [celoTX, signer];
}
function recoverTransactionEIP1559(serializedTransaction) {
    const transactionArray = prefixAwareRLPDecode(serializedTransaction, 'eip1559');
    debug('signing-utils@recoverTransactionEIP1559: values are %s', transactionArray);
    const [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList, vRaw, r, s,] = transactionArray;
    const celoTx = Object.assign({ type: 'eip1559', nonce: nonce.toLowerCase() === '0x' ? 0 : parseInt(nonce, 16), gas: gas.toLowerCase() === '0x' ? 0 : parseInt(gas, 16), maxPriorityFeePerGas: maxPriorityFeePerGas.toLowerCase() === '0x' ? 0 : parseInt(maxPriorityFeePerGas, 16), maxFeePerGas: maxFeePerGas.toLowerCase() === '0x' ? 0 : parseInt(maxFeePerGas, 16), to, value: value.toLowerCase() === '0x' ? 0 : parseInt(value, 16), data, chainId: chainId.toLowerCase() === '0x' ? 0 : parseInt(chainId, 16), accessList: (0, formatter_1.parseAccessList)(accessList) }, vrsForRecovery(vRaw, r, s));
    const web3Account = new web3_eth_accounts_1.default();
    const signer = web3Account.recoverTransaction(serializedTransaction);
    return [celoTx, signer];
}
function recoverCeloLegacy(serializedTransaction) {
    const rawValues = eth_lib_1.RLP.decode(serializedTransaction);
    debug('signing-utils@recoverTransaction: values are %s', rawValues);
    const recovery = eth_lib_1.bytes.toNumber(rawValues[9]);
    //  eslint-disable-next-line no-bitwise
    const chainId = eth_lib_1.bytes.fromNumber((recovery - 35) >> 1);
    const celoTx = {
        type: 'celo-legacy',
        nonce: rawValues[0].toLowerCase() === '0x' ? 0 : parseInt(rawValues[0], 16),
        gasPrice: rawValues[1].toLowerCase() === '0x' ? 0 : parseInt(rawValues[1], 16),
        gas: rawValues[2].toLowerCase() === '0x' ? 0 : parseInt(rawValues[2], 16),
        feeCurrency: rawValues[3],
        gatewayFeeRecipient: rawValues[4],
        gatewayFee: rawValues[5],
        to: rawValues[6],
        value: rawValues[7],
        data: rawValues[8],
        chainId,
    };
    const { r, v, s } = extractSignatureFromDecoded(rawValues);
    const signature = eth_lib_1.account.encodeSignature([v, r, s]);
    const extraData = recovery < 35 ? [] : [chainId, '0x', '0x'];
    const signingData = rawValues.slice(0, 9).concat(extraData);
    const signingDataHex = eth_lib_1.RLP.encode(signingData);
    const signer = eth_lib_1.account.recover(getHashFromEncoded(signingDataHex), signature);
    return [celoTx, signer];
}
function recoverEthereumLegacy(serializedTransaction) {
    const rawValues = eth_lib_1.RLP.decode(serializedTransaction);
    debug('signing-utils@recoverTransaction: values are %s', rawValues);
    const recovery = eth_lib_1.bytes.toNumber(rawValues[6]);
    //  eslint-disable-next-line no-bitwise
    const chainId = eth_lib_1.bytes.fromNumber((recovery - 35) >> 1);
    const celoTx = {
        type: 'ethereum-legacy',
        nonce: rawValues[0].toLowerCase() === '0x' ? 0 : parseInt(rawValues[0], 16),
        gasPrice: rawValues[1].toLowerCase() === '0x' ? 0 : parseInt(rawValues[1], 16),
        gas: rawValues[2].toLowerCase() === '0x' ? 0 : parseInt(rawValues[2], 16),
        to: rawValues[3],
        value: rawValues[4],
        data: rawValues[5],
        chainId,
    };
    const { r, v, s } = extractSignatureFromDecoded(rawValues);
    const signature = eth_lib_1.account.encodeSignature([v, r, s]);
    const extraData = recovery < 35 ? [] : [chainId, '0x', '0x'];
    const signingData = rawValues.slice(0, 6).concat(extraData);
    const signingDataHex = eth_lib_1.RLP.encode(signingData);
    const signer = eth_lib_1.account.recover(getHashFromEncoded(signingDataHex), signature);
    return [celoTx, signer];
}
function recoverMessageSigner(signingDataHex, signedData) {
    const dataBuff = toBuffer(signingDataHex);
    const msgHashBuff = hashPersonalMessage(dataBuff);
    const signature = fromRpcSig(signedData);
    const publicKey = ecrecover(msgHashBuff, signature.v, signature.r, signature.s);
    const address = pubToAddress(publicKey, true);
    return (0, address_1.ensureLeading0x)(address.toString('hex'));
}
exports.recoverMessageSigner = recoverMessageSigner;
function verifyEIP712TypedDataSigner(typedData, signedData, expectedAddress) {
    const dataHex = ethUtil.bufferToHex((0, sign_typed_data_utils_1.generateTypedDataHash)(typedData));
    return verifySignatureWithoutPrefix(dataHex, signedData, expectedAddress);
}
exports.verifyEIP712TypedDataSigner = verifyEIP712TypedDataSigner;
function verifySignatureWithoutPrefix(messageHash, signature, signer) {
    try {
        (0, signatureUtils_1.parseSignatureWithoutPrefix)(messageHash, signature, signer);
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.verifySignatureWithoutPrefix = verifySignatureWithoutPrefix;
function decodeSig(sig) {
    const [v, r, s] = eth_lib_1.account.decodeSignature(sig);
    return {
        v: parseInt(v, 16),
        r: toBuffer(r),
        s: toBuffer(s),
    };
}
exports.decodeSig = decodeSig;
//# sourceMappingURL=signing-utils.js.map
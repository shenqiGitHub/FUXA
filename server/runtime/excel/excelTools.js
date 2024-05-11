const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// 删除文件
const removeSpecifyFile = (filename) => {
    const filePath = path.join(__dirname, '../../../uploads');
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(`${filePath}/${filename}`);
        return true;
    }
    return false;
};

// 删除文件夹及文件内所有的文件夹及文件
const removeFolder = (folderPath) => {
    const files = fs.readdirSync(folderPath);
    files.forEach((item) => {
        const stats = fs.statSync(`${folderPath}/${item}`);
        if (stats.isDirectory()) {
            removeFolder(`${folderPath}/${item}`);
        } else {
            fs.unlinkSync(`${folderPath}/${item}`);
        }
    });
    fs.rmdirSync(folderPath);
};

// 删除文件夹里面的所有文件
const delFiles = (folderPath) => {
    const files = fs.readdirSync(folderPath);
    files.forEach((item) => {
        fs.unlinkSync(`${folderPath}/${item}`);
    });
};

// 返回数据下划线转化为驼峰命名
const formatHumpLineTransfer = (data, type = 'hump') => {
    const newData = Object.prototype.toString.call(data) === '[object Object]' ? [JSON.parse(JSON.stringify(data))] : JSON.parse(JSON.stringify(data));
    const toggleFn = (list) => {
        list.forEach((item) => {
            for (const key in item) {
                if (Object.prototype.toString.call(item[key]) === '[object Object]') {
                    toggleFn([item[key]]);
                } else if (Object.prototype.toString.call(item[key]) === '[object Array]') {
                    toggleFn(item[key]);
                } else if (type === 'hump') {
                    const keyArr = key.split('_');
                    let str = '';
                    keyArr.forEach((itemKey, index) => {
                        if (itemKey) {
                            if (index) {
                                const arr = itemKey.split('');
                                arr[0] = arr[0].toUpperCase();
                                str += arr.join('');
                            } else {
                                str += itemKey;
                            }
                        }
                    });
                    const newValue = item[key];
                    delete item[key];
                    item[str] = newValue;
                } else if (type === 'line') {
                    const newKey = key.split('');
                    newKey.forEach((item2, index2) => {
                        if (/^[A-Z]+$/.test(item2)) {
                            newKey[index2] = `_${item2.toLowerCase()}`;
                        }
                    });
                    const newValue = item[key];
                    delete item[key];
                    item[newKey.join('')] = newValue;
                }
            }
        });
    };
    toggleFn(newData);
    if (Object.prototype.toString.call(data) === '[object Object]') {
        let obj = null;
        newData.forEach((item) => {
            obj = item;
        });
        return obj;
    }
    return newData;
};

// 对象扁平化
const flatten = (obj) => {
    const result = {};
    const process = (key, value) => {
        if (Object.prototype.toString.call(value) === '[object Object]') {
            const objArr = Object.keys(value);
            objArr.forEach((item) => {
                process(key ? `${key}.${item}` : `${item}`, value[item]);
            });
            if (objArr.length === 0 && key) {
                result[key] = {};
            }
        } else if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                process(`${key}[${i}]`, value[i]);
            }
            if (value.length === 0) {
                result[key] = [];
            }
        } else if (key) {
            result[key] = value;
        }
    };
    process('', obj);
    return result;
};

// 字典数据映射
const dictMapFn = (dicts) => {
    const maps = {};
    for (const key in dicts) {
        maps[key] = {}; // Prepare the mapping object for each category
        // Iterate over the object properties directly
        for (const dictKey in dicts[key]) {
            maps[key][dictKey] = dicts[key][dictKey]; // Assign the label directly
        }
    }
    return maps;
};

// 下划线转首字母和下划线后首字母大写，并去掉下划线
const underlineToCamel = (str) => str.replace(/_(\w)/g, (match, p1) => p1.toUpperCase()).replace(/^\w/, (match) => match.toUpperCase());

// 下划线后首字母大写，并去掉下划线
const underline = (str) => str.replace(/_(\w)/g, (match, p1) => p1.toUpperCase());

// 生成随机的hash值
const createHash = (hashLength = 30) => Array.from(Array(Number(hashLength)), () => Math.floor(Math.random() * 36).toString(36)).join('');

// 密码加密
const pwdHash = (newPwd) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(newPwd, salt);
};

module.exports = {
    removeSpecifyFile,
    removeFolder,
    delFiles,
    formatHumpLineTransfer,
    flatten,
    dictMapFn,
    underlineToCamel,
    underline,
    createHash,
    pwdHash
};

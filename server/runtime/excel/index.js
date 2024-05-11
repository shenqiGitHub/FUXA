const ExcelJS = require('exceljs');
const { dictMapFn, flatten } = require('./excelTools');
const { PassThrough } = require('stream');
const excelBaseStyle = {
    font: {
        size: 10,
        bold: true,
        color: { argb: 'ffffff' }
    },
    alignment: { vertical: 'middle', horizontal: 'center' },
    fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '808080' }
    },
    border: {
        top: { style: 'thin', color: { argb: '9e9e9e' } },
        left: { style: 'thin', color: { argb: '9e9e9e' } },
        bottom: { style: 'thin', color: { argb: '9e9e9e' } },
        right: { style: 'thin', color: { argb: '9e9e9e' } }
    }
}

function ExcelUnit(_runtime) {
    this.excelJsExport = async function (options, outputStream) {
        try{
            if(options.style === undefined){
                options.style = excelBaseStyle;
            }
            const { sheetName, style, headerColumns, tableData, dicts } = options;
            const workbook = new ExcelJS.Workbook();
            //to do 添加用户信息
            workbook.creator = '用户'
            workbook.created = new Date();
            const worksheet = workbook.addWorksheet(sheetName);
            if (headerColumns.length > 0) {
                // 设置列头
                const columnsData = headerColumns.map((column) => {
                    const { width } = column;
                    return {
                        header: column.title,
                        key: column.dataIndex,
                        width: Number.isNaN(width) ? 20 : width / 5,
                        style: column.numFmt ? { numFmt: column.numFmt } : {}
                    };
                });
                worksheet.columns = columnsData;

                // 设置表头样式
                const headerRow = worksheet.getRow(1);
                headerRow.eachCell((cell) => {
                    cell.style = style;
                });
            }
            //数据预处理

            // 设置行数据
            if (tableData.length > 0) {
                const data = [];
                let dictMap = {};

                if (dicts) {
                    dictMap = dictMapFn(dicts);
                }

                tableData.forEach((table) => {
                    const obj = {};
                    const tableFlat = flatten(table);

                    headerColumns.forEach((header) => {
                        const value = tableFlat[header.dataIndex];

                        // 如果存在字典映射并且对应的值存在
                        if (dictMap[header.dataIndex] && value !== undefined) {
                            obj[header.dataIndex] = dictMap[header.dataIndex][value];
                        }
                        // 如果字段需要格式化为日期且值存在
                        else if (header.numFmt && value !== undefined) {
                            if (value === 0) {
                                // 设置为null或空字符串来表示空值
                                obj[header.dataIndex] = null;  // 或者 ''
                            } else {
                                // 值非0，进行日期转换
                                obj[header.dataIndex] = new Date(value);
                            }                        }
                        // 如果上述条件都不满足，则直接使用原始数据
                        else {
                            obj[header.dataIndex] = value;
                        }
                    });
                    data.push(obj);
                });

                // 添加行
                worksheet.addRows(data);

                // 获取每列数据，依次对齐
                worksheet.columns.forEach((column) => {
                    column.alignment = style.alignment;
                });

                // 设置每行的边框
                const dataLength = data.length;
                const tableRows = worksheet.getRows(2, dataLength + 1);
                tableRows.forEach((row) => {
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.border = style.border;
                    });
                });
            }
            await workbook.xlsx.write(outputStream);
        }catch (err){
            throw err;
        }
    };


}




module.exports = {
    create: function (runtime) {
        return new ExcelUnit(runtime);
    }
}
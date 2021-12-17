let metaList = [
    {
        "title": "12333",
        "date": "2021-03-05 15:06:01"
    },
    {
        "title": "44444",
        "date": "2021-07-05 15:06:01"
    },
    {
        "title": "8888",
        "date": "2021-01-05 15:06:01"
    },
    {
        "title": "9999",
        "date": "2021-01-02 15:06:01"
    }
]


let sortedMetaList = metaList.sort(function(a, b){
    let date1 = new Date(Date.parse(a["date"]))
    let date2 = new Date(Date.parse(b["date"]))
    return date2 - date1;
});

console.log(sortedMetaList)


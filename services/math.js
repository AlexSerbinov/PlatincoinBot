
const roundUp = (value, exp) => {
    value = +value;
    exp = +exp;
    value = value.toString().split('e');
    value = Math.ceil(+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}
module.exports = {roundUp}

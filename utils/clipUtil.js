const logger = require("./logger");
const Enum = require('enum');

const LikeClipType = new Enum({ 'Like': 1, 'Impressive': 2, 'Funny': 3, 'Discussion': 4 });

function hasType(likeValue, userTypes) {
    if (userTypes && likeValue) {
        if (userTypes.includes(likeValue.key)) {

            return true;
        }
    }

    return false;
}

// TODO: Needs to be retested - it may not work with changes to model etc
function checkType(type) {
    let found = false;
    LikeClip.LikeClipType.values.forEach(element => {
        //   Like.rawAttributes.Type.values.forEach(element => {
        if (type == element) {
            found = true;
        }
    });

    return found;
}

function getLikesCount(likeValue, likes) {
    let count = 0;

    if (likes && likes.length > 0) {
        if (LikeClipType.isDefined(likeValue)) {
            likes.forEach(like => {
                let types = like.Types;

                if (types.includes(likeValue.key)) {
                    count++;
                }
            });
        }
    }

    return count;
}

const clipUtil = {
    LikeClipType,
    hasType: hasType,
    checkType: checkType,
    getLikesCount: getLikesCount
};

module.exports = clipUtil;
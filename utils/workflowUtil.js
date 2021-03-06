const WORKFLOW_NAME = 'workflow';
const LOGGED_ON_USER_KEY = 'loggedOnUser';
const CLIPS_COUNT_KEY = 'clipsCount';

// TODO add more checks for null parameters

function setValue(name, value, workflow) {
    let workflowNew = {};

    workflowNew[name] = value;

    if (workflow) {

        workflowNew = Object.assign(workflow, workflowNew);
    }

    return workflowNew;
}

function deleteValue(name, workflow) {
    if (name && workflow && workflow.hasOwnProperty(name)) {

        delete workflow[name];
    }

    return workflow;
}

function getValue(name, workflow) {
    let value = "";

    if (name && workflow && workflow.hasOwnProperty(name)) {
        value = workflow[name];
    }

    return value;
}

function getKeys(workflow) {
    let keys = [];

    if (workflow) {
        keys = Object.keys(workflow);
    }

    return keys;
}

function hasKey(key, workflow) {
    if (key && workflow) {
        let keys = Object.keys(workflow);

        if (keys.includes(key)) {
            return true;
        }
    }

    return false;
}

const workflowUtil = {
    WORKFLOW_NAME,
    LOGGED_ON_USER_KEY,
    CLIPS_COUNT_KEY,
    setValue: setValue,
    deleteValue: deleteValue,
    getValue: getValue,
    getKeys: getKeys,
    hasKey: hasKey
};

module.exports = workflowUtil;
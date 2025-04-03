import {Button, ButtonGroup} from "react-bootstrap";
import {useEffect, useState} from "react";
import { useGameData } from "@/context/GameDataContext";
import { DEFAULT_PLATFORMS, DEFAULT_GENRES } from "@/utils/GenresPlatforms.jsx";
import { useNavigate } from "react-router-dom";

export function ModifyDetails({ gameData }) {
    const { actions } = useGameData();
    const navigate = useNavigate();

    var formFields = [
        {
            fieldName: "Id",
            type: "number",
            extraText: "If the ID already exists then update, otherwise add",
            useStateList: useState(0)
        },
        {
            fieldName: "IconID",
            type: "text",
            extraText: "ID/name of the icon used for a game",
            useStateList: useState("")
        },
        {
            fieldName: "Name",
            type: "text",
            extraText: "String of characters",
            useStateList: useState("")
        },
        {
            fieldName: "Price",
            type: "number",
            extraText: "Price is in dollars $ (only input the numerical value - float)",
            useStateList: useState(0)
        },
        {
            fieldName: "Rating",
            type: "number",
            extraText: "Float between 0-5",
            useStateList: useState(0)
        },
        {
            fieldName: "Description",
            type: "textarea",
            extraText: "String of characters, can be empty",
            useStateList: useState("")
        },
        {
            fieldName: "Genres",
            type: "buttongroup",
            extraText: "Select all the applicable genres",
            buttonGroupOptions: DEFAULT_GENRES,
            useStateList: useState([]),
        },
        {
            fieldName: "Platforms",
            type: "buttongroup",
            extraText: "Select all the applicable platforms",
            buttonGroupOptions: DEFAULT_PLATFORMS,
            useStateList: useState([]),
        },
    ]

    // Initialize form with existing game data
    useEffect(() => {
        for (var i = 0; i < formFields.length; i++) {
            var formFieldDict = formFields[i];
            formFieldDict.useStateList[1](gameData[formFieldDict.fieldName])
        }
    }, []); // Runs only once when component mounts

    function updateButtonGroupSelected(optionUseState, newOption) {
        if (optionUseState[0].includes(newOption)) {
            optionUseState[1]( // remove the new option if already present
                optionUseState[0].filter(option => option !== newOption)
            )
        }
        else {
            optionUseState[1]([ // add the new option is not already present
                ...optionUseState[0],
                newOption
            ])
        }
    }

    var [deletePrompt, setDeletePrompt] = useState(false)
    async function deleteGameButtonActivated() {
        if (!deletePrompt) {
            setDeletePrompt(true)
            setTimeout(() => {
                setDeletePrompt(false)
            }, 5000)
        }
        else {
            await actions.deleteGame(getFormGameData().Id);
            navigate('/');
            // Don't delete here, just navigate with the action and data
            // The MainPage will handle the actual deletion
            //navigate('/', { state: { action: 'delete', gameData: getFormGameData() } });
        }
    }

    async function handleSave() {
        if (dataValid) {
            const formData = getFormGameData();
            await actions.modifyGame(formData);
            navigate('/');
            // Don't modify here, just navigate with the action and data
            // The MainPage will handle the actual modification
            //navigate('/', { state: { action: 'modify', gameData: formData } });
        }
    };

    function getFormGameData() {
        var newGameData = {}
        for (var i = 0; i < formFields.length; i++) {
            newGameData[formFields[i].fieldName] = formFields[i].useStateList[0]
        }

        return newGameData;
    }

    function isDataValid() {
        for (var ff of formFields) {
            if (ff.type == "number") {
                if (ff.useStateList[0] <= 0)
                    return false

                if (ff.fieldName == "Rating" && ff.useStateList[0] > 5)
                    return false
            }
            else if (ff.type == "text" && ff.useStateList[0] === "") {
                return false
            }
        }

        return true
    }

    var [dataValid, setDataValid] = useState(isDataValid());

    function setIfDataValid() {
        setDataValid(isDataValid());
    }

    setTimeout(() => {
        setIfDataValid()
    }, 1)

    return (
        <div style={{
            backgroundColor: "#1F0D44",
            border: 0,
            borderRadius: "1rem",
            color: "white",
            padding: "3rem",
            width: "100%",
        }}>
            <div>
                <h3 style={{display: "block", padding: "1rem 0 2rem"}}>Update / add / delete game:</h3>
                {formFields.map((field) => (
                    <form className="form-floating" key={field.fieldName}>
                        <div className="form-floating mb-3" >
                            {field.type === "textarea"
                                ? <>
                                    <textarea className="form-control formDiv" id="floatingInput"
                                              placeholder={field.fieldName} value={field.useStateList[0] || null}
                                              onChange={(event) => {field.useStateList[1](event.target.value)}}
                                    />
                                    <label htmlFor="floatingInput" className="formLabel">{field.fieldName}</label>
                                </>
                                : field.type === "buttongroup"
                                    ? <>
                                        <ButtonGroup aria-label={field.fieldName}>
                                            { field.buttonGroupOptions.map(option => (
                                                <Button key={option} variant="dark" active={field.useStateList[0].includes(option)}
                                                    onClick={() => updateButtonGroupSelected(field.useStateList, option)}>
                                                    {option}
                                                </Button>
                                            ))}
                                        </ButtonGroup>
                                    </>
                                    : <>
                                        <input type={field.type} className="form-control formDiv" id="floatingInput"
                                               placeholder={field.fieldName} value={field.useStateList[0] || null}
                                               onChange={(event) => {setIfDataValid(); field.useStateList[1](event.target.value)}}
                                        />
                                        <label htmlFor="floatingInput" className="formLabel">{field.fieldName}</label>
                                    </>
                            }
                        </div>
                        <p style={{color: "rgba(255,255,255,.2)", padding: "0 0 1rem"}}>
                            {field.extraText}</p>
                    </form>
                ))}

                <div style={{
                    display: "flex", flexDirection: "column",
                    justifyContent: "center", width: "100%", alignItems: "center",
                    margin: "5rem 0 0"
                }}>
                    <button 
                        onClick={handleSave}
                        disabled={!dataValid}
                        className={"linkButton viewPageButton addToCartButton"}
                        style={{cursor: dataValid ? 'pointer' : 'not-allowed'}}
                    >
                        Process request
                    </button>

                    {
                        !dataValid &&
                        <h6 style={{color: "red", margin: "1rem 0 0"}}>Invalid data provided</h6>
                    }

                    {deletePrompt
                        ? <>
                            <button
                                onClick={deleteGameButtonActivated}
                                className={"linkButton viewPageButton deleteGameButton"}
                            >
                                Delete game with the given ID
                            </button>
                            <h6 style={{color: "red", margin: "1rem 0 0"}}>Are you sure you want to permanently delete this game? Press the button again to proceed.</h6>
                        </>
                        : <button className={"viewPageButton deleteGameButton"} onClick={deleteGameButtonActivated}>
                            Delete game with the given ID
                        </button>
                    }
                </div>
            </div>
        </div>
    )
}
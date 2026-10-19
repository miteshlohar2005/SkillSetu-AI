import { createSlice } from "@reduxjs/toolkit";


const userSlice = createSlice({
    name:"user",
    initialState:{
        userData:null
    },
    reducers: {
        setUserData: (state, action) => {
            if (!action.payload) {
                state.userData = null;
            } else if (state.userData) {
                state.userData = {
                    ...state.userData,
                    ...action.payload,
                    isProfileCompleted:
                        action.payload.isProfileCompleted !== undefined
                            ? Boolean(action.payload.isProfileCompleted)
                            : Boolean(state.userData.isProfileCompleted),
                };
            } else {
                state.userData = action.payload;
            }
        },
    },
})

export const {setUserData} = userSlice.actions

export default userSlice.reducer
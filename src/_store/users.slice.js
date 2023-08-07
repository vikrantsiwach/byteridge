import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { authActions } from '_store';
import { fetchWrapper } from '_helpers';

// create slice

const name = 'users';
const initialState = createInitialState();
const extraActions = createExtraActions();
const extraReducers = createExtraReducers();
const reducers = createReducers()
const slice = createSlice({ name, initialState, extraReducers, reducers });

// exports

export const userActions = { ...slice.actions, ...extraActions };
export const usersReducer = slice.reducer;

// implementation

function createInitialState() {
    return {
        list: null,
        item: null,
        filteredList: null,
        sortOrder: "asc",
    }
}

function createReducers() {
    return {
        sort,
        filter,
        pagination
    }

    function pagination(state, action) {
        const page = action.payload || 1;
        const perPage = 10;
        const offset = (page - 1) * perPage
        const users = state.list.value
        const paginatedItems = users.slice(offset).slice(0, perPage);
        state.filteredList.value = paginatedItems
    }

    function sort(state, action) {
        const sortKey = action.payload;
        const sortOrder = state.sortOrder;
        const users = state.filteredList.value;
                
        const updatedUsers = [...users].sort((a,b) => {
            return a[sortKey].toString().localeCompare(b[sortKey].toString(), "en", {
                numeric: true
            }) * (sortOrder === "asc" ? 1 : -1)
        })
        state.filteredList.value = updatedUsers;
        state.sortOrder = sortOrder === "asc" ? "dec" : "asc"
    }

    function filter(state, action) {
        const filterKey = action.payload
        const users = state.list.value

        if (filterKey === "") {
            state.filteredList.value = state.list.value
        } else {
            const updatedUsers = [...users].filter((el) => {
                return el.firstName.includes(filterKey) || el.lastName.includes(filterKey) || el.username.includes(filterKey)
            })
            state.filteredList.value = updatedUsers
        }
    }
}

function createExtraActions() {
    const baseUrl = `${process.env.REACT_APP_API_URL}/users`;

    return {
        register: register(),
        getAll: getAll(),
        getById: getById(),
        update: update(),
        delete: _delete(),
    };

    function register() {
        return createAsyncThunk(
            `${name}/register`,
            async (user) => await fetchWrapper.post(`${baseUrl}/register`, user)
        );
    }

    function getAll() {
        return createAsyncThunk(
            `${name}/getAll`,
            async () => await fetchWrapper.get(baseUrl)
        );
    }


    function getById() {
        return createAsyncThunk(
            `${name}/getById`,
            async (id) => await fetchWrapper.get(`${baseUrl}/${id}`)
        );
    }

    function update() {
        return createAsyncThunk(
            `${name}/update`,
            async function ({ id, data }, { getState, dispatch }) {
                await fetchWrapper.put(`${baseUrl}/${id}`, data);

                // update stored user if the logged in user updated their own record
                const auth = getState().auth.value;
                if (id === auth?.id.toString()) {
                    // update local storage
                    const user = { ...auth, ...data };
                    localStorage.setItem('auth', JSON.stringify(user));

                    // update auth user in redux state
                    dispatch(authActions.setAuth(user));
                }
            }
        );
    }

    // prefixed with underscore because delete is a reserved word in javascript
    function _delete() {
        return createAsyncThunk(
            `${name}/delete`,
            async function (id, { getState, dispatch }) {
                await fetchWrapper.delete(`${baseUrl}/${id}`);

                // auto logout if the logged in user deleted their own record
                if (id === getState().auth.value?.id) {
                    dispatch(authActions.logout());
                }
            }
        );
    }
}

function createExtraReducers() {
    return (builder) => {
        getAll();
        getById();
        _delete();

        function getAll() {
            var { pending, fulfilled, rejected } = extraActions.getAll;
            builder
                .addCase(pending, (state) => {
                    state.list = { loading: true };
                })
                .addCase(fulfilled, (state, action) => {
                    state.list = { value: action.payload };
                    state.filteredList = { value: action.payload };
                })
                .addCase(rejected, (state, action) => {
                    state.list = { error: action.error };
                });
        }

        function getById() {
            var { pending, fulfilled, rejected } = extraActions.getById;
            builder
                .addCase(pending, (state) => {
                    state.item = { loading: true };
                })
                .addCase(fulfilled, (state, action) => {
                    state.item = { value: action.payload };
                })
                .addCase(rejected, (state, action) => {
                    state.item = { error: action.error };
                });
        }

        function _delete() {
            var { pending, fulfilled, rejected } = extraActions.delete;
            builder
                .addCase(pending, (state, action) => {
                    const user = state.list.value.find(x => x.id === action.meta.arg);
                    user.isDeleting = true;
                })
                .addCase(fulfilled, (state, action) => {
                    state.list.value = state.list.value.filter(x => x.id !== action.meta.arg);
                })
                .addCase(rejected, (state, action) => {
                    const user = state.list.value.find(x => x.id === action.meta.arg);
                    user.isDeleting = false;
                });
        }
    }
}

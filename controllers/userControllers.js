class UserController {
    constructor(formIdCreate, formIdUpdade, tableId) {
        this.formEl = document.getElementById(formIdCreate)
        this.formUpdadeEl = document.getElementById(formIdUpdade)
        this.tableEl = document.getElementById(tableId)

        this.onSubmit()
        this.onEdit()
        this.selectall();
    }

    onEdit(formEl) {
        document.querySelector("#box-user-update .btn-cancel").addEventListener("click", e => {
            this.showPanelCreate();
        })

        this.formUpdadeEl.addEventListener("submit", event => {

            event.preventDefault();

            let btn = this.formUpdadeEl.querySelector("[type=submit]");

            btn.disable = true;

            let values = this.getValues(this.formUpdadeEl);

            let index = this.formUpdadeEl.dataset.trIndex;

            let tr = this.tableEl.rows[index];

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values);

            if (!values.photo) result._photo = userOld._photo;


            this.getPhotos(this.formUpdadeEl).then(
                (content) => {

                    if (!values.photo) {
                        result._photo = userOld._photo
                    } else {
                        result._photo = content;
                    }

                    let user = new User();

                    user.loadFromJson(result);

                    user.save();

                    this.getTr(user, tr);

                    this.updateCount();

                    this.formUpdadeEl.reset();

                    btn.disable = false;

                    this.showPanelCreate();

                },
                (e) => {
                    console.error(e);
                }
            );

        })

    }

    onSubmit() {

        this.formEl.addEventListener('submit', event => {

            event.preventDefault();

            let btn = this.formEl.querySelector("[type=submit]");

            btn.disable = true;

            let values = this.getValues(this.formEl);

            if (!values) return false;

            this.getPhotos(this.formEl).then(
                (content) => {

                    values.photo = content;

                    values.save();

                    this.addLine(values);

                    this.formEl.reset();

                    btn.disable = false;

                },
                (e) => {
                    console.error(e);
                }
            );

        });
    }

    getPhotos(formEl) {

        return new Promise((resolve, reject) => {

            let fileRender = new FileReader();

            let elements = [...formEl.elements].filter(item => {
                if (item.name === 'photo') {
                    return item
                }
            })

            let file = elements[0].files[0];

            fileRender.onload = () => {

                resolve(fileRender.result);
            }

            fileRender.onerror = (e) => {
                reject(e);
            }

            if (file) {
                fileRender.readAsDataURL(file);
            }
            else {
                resolve('icone.png');
            }


        })


    }

    getValues(formEl) {

        let user = {};
        let isValid = true;


        [...formEl.elements].forEach(function (field, index) {

            if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value) {

                field.parentElement.classList.add('has-error');
                isValid = false;
            }


            if (field.name == 'gender') {
                if (field.checked) {
                    user[field.name] = field.value
                }

            } else if (field.name == 'admin') {

                user[field.name] = field.checked;

            } else {

                user[field.name] = field.value
            }

        })

        if (!isValid) {
            return false;
        }
        return new User(user.name, user.gender, user.birth, user.country, user.email, user.password, user.photo, user.admin)
    }

    selectall() {
        
        let users = User.getUserStorage();

        users.forEach(dataUser =>{

            let user = new User();

            user.loadFromJson(dataUser);

            this.addLine(user);
        })  


    }

    // insert(data) {
    //     let users = this.getUserStorage();

    //     users.push(data);

    //     //salva na locaStorage
    //     localStorage.setItem("users", JSON.stringify(users));
    //     //salva na sessionStorage
    //     //sessionStorage.setItem("users", JSON.stringify(users));
    // }

    addLine(dataUser) {

        let tr = this.getTr(dataUser);

        this.tableEl.appendChild(tr);

        this.updateCount();
    }

    getTr(dataUser, tr=null){

        if (tr === null) tr = document.createElement('tr');

        tr.dataset.user = JSON.stringify(dataUser);

        tr.innerHTML = `
                <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
                <td>${dataUser.name}</td>
                <td>${dataUser.email}</td>
                <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>
                <td>${Utils.dateFormate(dataUser.register)}</td>
                <td>
                    <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                    <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
                </td>
            `

        this.addEventsTR(tr);

        return tr;
    }

    addEventsTR(tr) {

        tr.querySelector(".btn-delete").addEventListener("click", e => {

            if (confirm("Deseja realmente excluir?")) {

                let user = new User();

                user.loadFromJson(JSON.parse(tr.dataset.user));

                user.remove();

                tr.remove();

                this.updateCount();

            }
        });

        tr.querySelector(".btn-edit").addEventListener("click", e => {
            let json = JSON.parse(tr.dataset.user);

            this.formUpdadeEl.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json) {
                let field = this.formUpdadeEl.querySelector("[name=" + name.replace("_", "") + "]")

                if (field) {

                    switch (field.type) {
                        case 'file':
                            continue;
                            break;

                        case 'radio':
                            field = this.formUpdadeEl.querySelector("[name=" + name.replace("_", "") + "][value=" + json[name] + "]")
                            field.checked = true;
                            break

                        case 'checkbox':
                            field.checked = json[name];
                            break

                        default:
                            field.value = json[name];
                    }

                }

            }

            this.formUpdadeEl.querySelector(".photo").src = json._photo;

            this.showPanelUpdate();
        })
    }

    showPanelCreate() {
        document.querySelector("#box-user-create").style.display = "block";
        document.querySelector("#box-user-update").style.display = "none";
    }

    showPanelUpdate() {
        document.querySelector("#box-user-create").style.display = "none";
        document.querySelector("#box-user-update").style.display = "block";
    }

    updateCount() {
        let NumberUsers = 0;
        let NumberAdmin = 0;

        [...this.tableEl.children].forEach(tr => {
            NumberUsers++;

            let user = JSON.parse(tr.dataset.user);

            if (user._admin) NumberAdmin++;
        })

        document.querySelector('#number-users').innerHTML = NumberUsers;
        document.querySelector('#number-users-admin').innerHTML = NumberAdmin;
    }

}


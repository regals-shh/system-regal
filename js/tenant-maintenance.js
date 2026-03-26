const tenant = JSON.parse(localStorage.getItem("tenant"));

const form = document.querySelector("form");
const ticketContainer = document.querySelector(".card:nth-child(2) div");


// CREATE REQUEST
form.addEventListener("submit", async ()=>{

    const category = document.getElementById("issueCategory").value;
    const description = document.getElementById("issueDesc").value;

    const res = await fetch("/api/maintenance/create",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            tenantId:tenant._id,
            tenantName:tenant.name,
            roomNumber:tenant.room,
            category,
            description
        })
    });

    alert("Request Sent");

    loadTickets();

});


// LOAD TENANT REQUESTS
async function loadTickets(){

    const res = await fetch(`/api/maintenance/tenant/${tenant._id}`);

    const data = await res.json();

    ticketContainer.innerHTML="";

    data.forEach(ticket=>{

        ticketContainer.innerHTML += `

        <div style="border:1px solid #e5e7eb;padding:15px;border-radius:12px">

            <div style="display:flex;justify-content:space-between">

                <span style="font-weight:600">${ticket.category}</span>

                <span>${ticket.status}</span>

            </div>

            <p>${ticket.description}</p>

            <small>${new Date(ticket.createdAt).toLocaleDateString()}</small>

            <br><br>

            <button onclick="deleteTicket('${ticket._id}')">Delete</button>

        </div>

        `;

    });

}


// DELETE
async function deleteTicket(id){

    await fetch(`/api/maintenance/delete/${id}`,{
        method:"DELETE",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            tenantId:tenant._id
        })
    });

    loadTickets();

}

loadTickets();
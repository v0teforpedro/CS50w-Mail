document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');

    // Send mail on form submit, prevent default submit behaviour
    document.querySelector('#compose-form').addEventListener("submit", event => {
        event.preventDefault();
        send_mail();
    });

});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#letter-view').style.display = 'none';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#letter-view').style.display = 'none';

    // Show the mailbox name + create new div to separate mailbox name from emails
    document.querySelector('#emails-view').innerHTML = `
        <div class="d-grid gap-2 col-3 mx-auto">
            <button class="btn btn-secondary btn-lg disabled" id="block-name">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</button>
        </div>
        
        <div id="emails-box"></div>
    `;

    // fetch mailbox data
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        // Print emails
        console.log(emails);

        // Loop over emails and create HTML element for each one
        emails.forEach(email => {
            const element = document.createElement('div');

            // alter innerHTML display for  different mailboxes, using common if/else check
            if (mailbox === 'sent') {
                element.innerHTML = `
                    <p>TO: ${email.recipients}</p>
                    <p>Subject: ${email.subject}</p>
                    <p>${email.timestamp}</p>
                `;
            } else {
                element.innerHTML = `
                    <p>FROM: ${email.sender}</p>
                    <p>Subject: ${email.subject}</p>
                    <p>${email.timestamp}</p>
                `;
            }

            element.className = 'd-flex justify-content-between list-group-item';

            // another way to use 'if/else' statement:
            // (if email.read is true, then set 'element.id' to 'read', otherwise to 'unread')
            element.id = email.read ? 'read': 'unread';

            // on click for each email in mailbox - view that exact email
            element.addEventListener('click', function() {
                view_mail(email.id)
            });
            document.querySelector('#emails-box').append(element);

        })
    });
}

function send_mail() {

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {

      // Print result and load 'sent' mailbox
      console.log(result);
      load_mailbox('sent');
  });

}

function view_mail(email_id) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#letter-view').style.display = 'block';

    fetch(`/emails/${email_id}`)
        .then(response => response.json())
        .then(email => {

            // clear previous content
            document.querySelector('#letter-view').innerHTML = '';

            // create content view
            const element = document.createElement('div');
            element.className = 'd-flex justify-content-center';
            element.innerHTML = `
                <div class="card text-dark bg-light mb-3 w-75">
                    <div class="card-header">
                        <h3>${email.subject}</h3>
                    </div>
                    <div class="card-header">
                        FROM: <strong>${email.sender}</strong>
                    </div>
                    <div class="card-header">TO: ${email.recipients}</div>
                    
                    <div class="card-body">
                        <p class="card-title">${email.body}</p>
                        <hr>
                        <p class="card-text text-end"><i>${email.timestamp}</i></p>
                    </div>
                </div>
            `;

            // setting 'read' as true on click
            change_sate(email, 'read')

            // append content to our div
            document.querySelector('#letter-view').append(element);
        });
}

function change_sate(email, property) {

    // set 'read' to true on click
    if (property === 'read') {
        fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                read: true
            })
        })
        .then(response => response.json())

    // set archived to opposite state
    } else if (property === 'archived') {
        fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !email.archived
            })
        })
        .then(response => response.json())
    }

}
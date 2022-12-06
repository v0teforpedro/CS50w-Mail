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

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name + create new div to separate h3 from emails
    document.querySelector('#emails-view').innerHTML = `
        <h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
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
            element.innerHTML = `
                <p>FROM: ${email.sender}</p>
                <p>TO: ${email.recipients}</p>
                <p>Subject: ${email.subject}</p>
                <p>${email.timestamp}</p>
            `;
            element.className = 'd-flex justify-content-between list-group-item';
            element.id = 'test-id'
            element.addEventListener('click', function() {
                console.log(email)
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
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

function compose_email(action, data) {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#letter-view').style.display = 'none';

    if (action === 'reply') {
        // fill composition fields
        document.querySelector('#compose-recipients').value = data.recipient;

        // prevent repeat of 'Re:' - The indexOf() method returns -1 if the value is not found.
        if (data.subject.indexOf('Re: ') === -1) {
            document.querySelector('#compose-subject').value = 'Re: ' + data.subject;
        } else {
            document.querySelector('#compose-subject').value = data.subject;
        }

        document.querySelector('#compose-body').value = `\n\n<i>On ${data.timestamp}, ${data.recipient} wrote:</i>\n\n<small>${data.body}</small>`
    } else {
        // Clear out composition fields
        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
    }


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

        // creating 'ul' list-group element
        const list = document.createElement('ul');
        list.className = 'list-group';
        list.id = 'ul-id';

        // Loop over emails and create HTML element for each one
        emails.forEach(email => {
            const element = document.createElement('li');

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
                    <p class="add-archive">${email.timestamp}</p>
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

            // creating archive/unarchive button and logic
            const archive = document.createElement('button');
            archive.className = email.archived ? 'btn btn-sm btn-secondary': 'btn btn-sm btn-primary';
            archive.innerHTML = email.archived ? `<i class="bi bi-bookmark-dash"></i>`: `<i class="bi bi-bookmark-plus"></i>`;
            archive.id = 'archive-btn'

            // stopPropagation to prevent parent element click trigger
            archive.addEventListener('click', function(ev) {
                ev.stopPropagation();
                change_sate(email, 'archived');
                if (mailbox === 'inbox') {
                    load_mailbox('archive');
                    document.querySelector('#archived').setAttribute('class', 'nav-link active');
                    document.querySelector('#inbox').setAttribute('class', 'nav-link');
                } else {
                    load_mailbox('inbox');
                    document.querySelector('#inbox').setAttribute('class', 'nav-link active');
                    document.querySelector('#archived').setAttribute('class', 'nav-link');
                }
            });

            document.querySelector('#emails-box').append(list);
            document.querySelector('#ul-id').append(element);

            // appending archive/unarchive buttons
            document.querySelectorAll('.add-archive').forEach(row => {
                row.append(archive)
            });

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
                        <div class="card-title multiline">${email.body}</div>
                        <hr>
                        <p class="card-text text-end"><i>${email.timestamp}</i></p>
                    </div>
                    <div class="d-flex justify-content-between card-footer" id="footer">
                        <button id="reply-btn" class="btn btn-primary ms-auto">
                            Reply <i class="bi bi-reply"></i>
                        </button>
                    </div>
                </div>
            `;

            // setting 'read' as true on click
            change_sate(email, 'read')

            // append content to our div
            document.querySelector('#letter-view').append(element);

            // creating data to pre-fill reply form in 'compose-email'
            const data = {
                subject: email.subject,
                recipient: email.sender,
                body: email.body,
                timestamp: email.timestamp,
            }

            document.querySelector('#reply-btn').addEventListener("click", function() {
                compose_email('reply', data);
            });

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

    // set archived to opposite state
    } else if (property === 'archived') {
        fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !email.archived
            })
        })
    }

}
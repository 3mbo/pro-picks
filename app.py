from flask import Flask, render_template, redirect, request
from flask_scss import Scss
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
Scss(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
db = SQLAlchemy(app)


class MyTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f'<Task {self.id}>'


@app.route('/',methods=['GET','POST'])
def index():
    # Add task
    if request.method == 'POST':
        current_task = request.form['content']
        new_task = MyTask(content=current_task, completed=False)
        try:
            db.session.add(new_task)
            db.session.commit()
            return redirect('/')
        except Exception as e:
            print(f'Error: {e}')
            return f'There was an error adding task: {e}'
    # See current tasks
    else:
        tasks = MyTask.query.all()
        return render_template('index.html', tasks=tasks)

# Delete item
@app.route('/delete/<int:id>',methods=['GET','POST'])
def delete(id):
    task = MyTask.query.get_or_404(id)
    try:
        db.session.delete(task)
        db.session.commit()
        return redirect('/')
    except Exception as e:
        print(f'Error: {e}')

# Edit item

@app.route('/update/<int:id>',methods=['GET','POST'])
def update(id):
    task = MyTask.query.get_or_404(id)
    if request.method == 'POST':
        task.content = request.form['content']
        try:
            db.session.commit()
            return redirect('/')
        except Exception as e:
            print(f'Error: {e}')
    else:
        return render_template('update.html', task=task)


with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)

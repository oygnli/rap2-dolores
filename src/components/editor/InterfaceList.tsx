import React, { useState, MouseEventHandler } from 'react'
import { connect, Link, StoreStateRouterLocationURI, replace } from '../../family'
import { sortInterfaceList, deleteInterface } from '../../actions/interface'
import { deleteModule } from '../../actions/module'
import { Module, Repository, RootState, Interface, User } from '../../actions/types'
import { RSortable } from '../utils'
import InterfaceForm from './InterfaceForm'
import { useConfirm } from 'hooks/useConfirm'
import { GoPencil, GoTrashcan, GoLock } from 'react-icons/go'
import { getCurrentInterface } from '../../selectors/interface'
import { Button, ButtonGroup } from '@material-ui/core/'
import ModuleForm from './ModuleForm'
import MoveModuleForm from './MoveModuleForm'
import { useSelector, useDispatch } from 'react-redux'
import './InterfaceList.css'
import 'react-custom-scroll/dist/customScroll.css'
const CustomScroll = require('react-custom-scroll/dist/reactCustomScroll').default

interface InterfaceBaseProps {
  repository: Repository
  mod: Module
  active?: boolean
  auth?: User
  itf?: Interface
  curItf?: Interface
  deleteInterface: typeof deleteInterface
  replace?: typeof replace
}

function InterfaceBase(props: InterfaceBaseProps) {
  const { repository, mod, itf, curItf } = props
  const auth = useSelector((state: RootState) => state.auth)
  const router = useSelector((state: RootState) => state.router)
  const selectHref = StoreStateRouterLocationURI(router)
    .setSearch('itf', itf!.id.toString())
    .href()
  const [open, setOpen] = useState(false)

  const handleDeleteInterface: MouseEventHandler<HTMLAnchorElement> = e => {
    e.preventDefault()
    const message = `接口被删除后不可恢复！\n确认继续删除『#${itf!.id} ${itf!.name}』吗？`
    if (window.confirm(message)) {
      const { deleteInterface } = props
      deleteInterface(props.itf!.id, () => {
      })
      const { pathname, hash, search } = router.location
      replace(pathname + hash + search)
    }
  }

  return (
    <div className="Interface clearfix">
      <span>
        <Link
          to={selectHref}
          onClick={e => {
            if (
              curItf &&
              curItf.locker &&
              !window.confirm('编辑模式下切换接口，会导致编辑中的资料丢失，是否确定切换接口？')
            ) {
              e.preventDefault()
            } else {
              const top = document.querySelector<HTMLElement>('.InterfaceEditor')!.offsetTop - 10
              // 当接口列表悬浮时切换接口自动跳转到接口顶部
              if (window.scrollY > top) {
                window.scrollTo(0, top)
              }
            }
          }}
        >
          <div className="name">{itf!.name}</div>
          <div className="url">{itf!.url}</div>
        </Link>
      </span>
      {repository.canUserEdit ? (
        <div className="toolbar">
          {itf!.locker ? (
            <span className="locked mr5">
              <GoLock />
            </span>
          ) : null}
          {!itf!.locker || itf!.locker.id === auth.id ? (
            <span className="fake-link" onClick={() => setOpen(true)}>
              <GoPencil />
            </span>
          ) : null}
          <InterfaceForm
            title="修改接口"
            repository={repository}
            mod={mod}
            itf={itf}
            open={open}
            onClose={() => setOpen(false)}
          />
          {!itf!.locker ? (
            <Link to="" onClick={handleDeleteInterface}>
              <GoTrashcan />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
const mapStateToProps = (state: RootState) => ({
  curItf: getCurrentInterface(state),
  router: state.router,
})
const mapDispatchToProps = {
  replace,
  deleteInterface,
}
const InterfaceWrap = connect(mapStateToProps, mapDispatchToProps)(InterfaceBase)

interface InterfaceListProps {
  itfs?: Interface[]
  itf?: Interface
  curItf: Interface
  mod: Module
  repository: Repository
}
function InterfaceList(props: InterfaceListProps) {
  const [interfaceFormOpen, setInterfaceFormOpen] = useState(false)
  const [moduleFormOpen, setModuleFormOpen] = useState(false)
  const [moveModuleFormOpen, setMoveModuleFormOpen] = useState(false)
  const dispatch = useDispatch()
  const confirm = useConfirm()
  const auth = useSelector((state: RootState) => state.auth)
  const { repository, itf, itfs = [], mod } = props

  const handleDeleteModule: MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    const message = (
      <div>
        <div>模块被删除后不可恢复！并且会删除相关的接口！</div>
        <div>
          确认继续删除『#${mod.id} ${mod.name}
          』吗？
        </div>
      </div>
    )
    confirm({
      title: '确认删除模块',
      content: message,
    }).then(() => {
      dispatch(
        deleteModule(
          props.mod.id,
          () => {
          },
          repository!.id,
        ),
      )
    })
  }

  const handleSort = (_: any, sortable: any) => {
    dispatch(
      sortInterfaceList(sortable.toArray(), mod.id, () => {
        /** empty */
      }),
    )
  }
  return (
    <article className="InterfaceList">
      {repository.canUserEdit ? (
        <div className="header">
          <Button
            className="newIntf"
            variant="outlined"
            fullWidth={true}
            color="primary"
            onClick={() => setInterfaceFormOpen(true)}
          >
            新建接口
          </Button>

          <InterfaceForm
            title="新建接口"
            repository={repository}
            mod={mod}
            open={interfaceFormOpen}
            onClose={() => setInterfaceFormOpen(false)}
          />

          <ButtonGroup fullWidth={true} size="small">
            <Button variant="outlined" color="primary" onClick={() => setModuleFormOpen(true)}>
              修改模块
            </Button>
            <Button variant="outlined" color="primary" onClick={() => setMoveModuleFormOpen(true)}>
              移动/复制
            </Button>
            <Button variant="outlined" color="primary" onClick={handleDeleteModule}>
              删除模块
            </Button>
          </ButtonGroup>

          {moduleFormOpen && (
            <ModuleForm
              title="修改模块"
              module={mod}
              repository={repository}
              open={moduleFormOpen}
              onClose={() => setModuleFormOpen(false)}
            />
          )}

          {moveModuleFormOpen && (
            <MoveModuleForm
              title="移动/复制模块"
              mod={mod}
              repository={repository}
              open={moveModuleFormOpen}
              onClose={() => setMoveModuleFormOpen(false)}
            />
          )}
        </div>
      ) : null}
      {itfs.length ? (
        <div className="scrollWrapper">
          <CustomScroll>
            <RSortable onChange={handleSort} disabled={!repository.canUserEdit}>
              <ul className="body">
                {itfs.map((item: any) => (
                  <li
                    key={item.id}
                    className={item.id === itf!.id ? 'active sortable' : 'sortable'}
                    data-id={item.id}
                  >
                    <InterfaceWrap
                      repository={repository}
                      mod={mod}
                      itf={item}
                      active={item.id === itf!.id}
                      auth={auth}
                    />
                  </li>
                ))}
              </ul>
            </RSortable>
          </CustomScroll>
        </div>
      ) : (
        <div className="alert alert-info">暂无接口，请新建</div>
      )}
    </article>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(InterfaceList)
